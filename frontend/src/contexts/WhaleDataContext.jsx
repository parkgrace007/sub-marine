import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { TIMEFRAME_DURATIONS_MS } from '../config/timeframes'

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Constants
const MAX_WHALES_IN_MEMORY = 500
const MIN_WHALE_USD = 10_000_000 // $10M threshold
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

const WhaleDataContext = createContext(null)

/**
 * WhaleDataProvider - Global Supabase Realtime connection for whale data
 *
 * This provider maintains a SINGLE Supabase Realtime connection across
 * all pages, preventing connection drops during page navigation.
 *
 * Architecture:
 * - Initial data: Fetched via Backend API (uses SERVICE_ROLE key, cached)
 * - Realtime updates: Direct Supabase Realtime subscription
 * - Filtering: Done client-side via useWhaleData hook
 */
export function WhaleDataProvider({ children }) {
  const [allWhales, setAllWhales] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const channelRef = useRef(null)
  const cleanupIntervalRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)

  // Fetch initial data via Backend API (for caching + SERVICE_ROLE access)
  const fetchInitialWhales = async () => {
    try {
      console.log('🐋 [WhaleContext] Fetching initial whales via Backend API...')
      setLoading(true)
      setError(null)

      // Fetch 24h of data to cover all timeframes
      const params = new URLSearchParams({
        timeframe: '1d',
        symbol: '통합',
        flowTypes: 'inflow,outflow,exchange,defi,internal'
      })

      const response = await fetch(`${API_URL}/api/whales?${params}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch whales')
      }

      console.log(`✅ [WhaleContext] Initial fetch: ${json.data?.length || 0} whales`)
      setAllWhales(json.data || [])
      setError(null)
    } catch (err) {
      console.error('❌ [WhaleContext] Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Subscribe to Supabase Realtime for new whale events
  const subscribeToRealtime = () => {
    // Clean up existing channel if any
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      supabase.removeChannel(channelRef.current)
    }

    console.log('🔴 [WhaleContext] Subscribing to Supabase Realtime...')

    const channel = supabase
      .channel('whale-global-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whale_events'
        },
        (payload) => {
          const whale = payload.new

          // Filter by minimum amount
          if (whale.amount_usd < MIN_WHALE_USD) {
            return
          }

          console.log(`🐋 [WhaleContext] New whale via Realtime: $${(whale.amount_usd / 1e6).toFixed(1)}M ${whale.flow_type}`)

          setAllWhales((prev) => {
            // Check for duplicate
            if (prev.some(w => w.id === whale.id)) {
              return prev
            }

            // Add new whale at the beginning, limit total
            const updated = [whale, ...prev]
            if (updated.length > MAX_WHALES_IN_MEMORY) {
              return updated.slice(0, MAX_WHALES_IN_MEMORY)
            }
            return updated
          })
        }
      )
      .subscribe((status) => {
        console.log(`🔴 [WhaleContext] Realtime status: ${status}`)

        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setError(null)
          reconnectAttempts.current = 0
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          setError(`Realtime connection ${status}`)

          // Exponential backoff reconnect
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++

          console.log(`🔄 [WhaleContext] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts.current})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            subscribeToRealtime()
          }, delay)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        }
      })

    channelRef.current = channel
  }

  // Cleanup old whales periodically (to prevent memory bloat)
  const startCleanupInterval = () => {
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now()
      // Keep whales from last 24 hours + buffer
      const cutoffTime = now - (TIMEFRAME_DURATIONS_MS['1d'] * 1.5)

      setAllWhales((prev) => {
        const filtered = prev.filter((whale) => {
          const whaleTime = whale.timestamp * 1000
          return whaleTime >= cutoffTime
        })

        const removed = prev.length - filtered.length
        if (removed > 0) {
          console.log(`🗑️ [WhaleContext] Cleaned up ${removed} old whales`)
        }

        return filtered
      })
    }, CLEANUP_INTERVAL_MS)
  }

  // Initialize on mount
  useEffect(() => {
    console.log('🐋 [WhaleContext] Initializing global whale data provider...')

    // Fetch initial data first, then subscribe to realtime
    const initialize = async () => {
      await fetchInitialWhales()
      subscribeToRealtime()
      startCleanupInterval()
    }

    initialize()

    // Cleanup on unmount (app close)
    return () => {
      console.log('🧹 [WhaleContext] Cleaning up global whale data provider...')

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }

      if (channelRef.current) {
        channelRef.current.unsubscribe()
        supabase.removeChannel(channelRef.current)
      }
    }
  }, []) // Empty dependency - only run on mount/unmount

  // Manual refetch function
  const refetch = async () => {
    console.log('🔄 [WhaleContext] Manual refetch triggered')
    await fetchInitialWhales()
  }

  const value = {
    allWhales,
    isConnected,
    loading,
    error,
    refetch
  }

  return (
    <WhaleDataContext.Provider value={value}>
      {children}
    </WhaleDataContext.Provider>
  )
}

/**
 * useWhaleContext - Direct access to global whale context
 * Use this when you need raw access to all whales without filtering
 */
export function useWhaleContext() {
  const context = useContext(WhaleDataContext)
  if (!context) {
    throw new Error('useWhaleContext must be used within a WhaleDataProvider')
  }
  return context
}

/**
 * useWhaleData - Filtered whale data hook
 * This replaces the old useWhaleData hook with client-side filtering
 *
 * @param {string} timeframe - '1h', '4h', '8h', '12h', '1d'
 * @param {string[]|null} flowTypes - ['inflow', 'outflow', 'exchange', 'defi'] or null for all
 * @param {string} symbol - 'BTC', 'ETH', or '통합' for all
 */
export function useWhaleData(timeframe = '1h', flowTypes = null, symbol = '통합') {
  const { allWhales, isConnected, loading, error, refetch } = useWhaleContext()

  // Filter whales based on parameters
  const whales = useMemo(() => {
    const now = Date.now()
    const cutoff = now - (TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['1h'])

    return allWhales.filter((whale) => {
      // Time filter
      const whaleTime = whale.timestamp * 1000
      if (whaleTime < cutoff) return false

      // Flow type filter
      if (flowTypes && flowTypes.length > 0) {
        if (!flowTypes.includes(whale.flow_type)) return false
      }

      // Symbol filter
      if (symbol !== '통합') {
        if (whale.symbol?.toUpperCase() !== symbol.toUpperCase()) return false
      }

      return true
    })
  }, [allWhales, timeframe, flowTypes, symbol])

  return {
    whales,
    loading,
    error,
    isConnected,
    refetch
  }
}

export default WhaleDataContext
