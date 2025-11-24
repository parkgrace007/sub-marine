import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { TIMEFRAME_DURATIONS_MS } from '../config/timeframes'

// Performance optimization (2025-11-22): Fetch only timeframe-relevant data instead of 30 days
const BUFFER_MULTIPLIER = 2 // Fetch 2x timeframe duration for safety margin (1h → 2h, 4h → 8h)
const MIN_WHALE_USD = 10_000_000 // $10M threshold for Tier 1+ whales (2025-11-19: synchronized with Whale Alert API)
const MAX_WHALES_IN_MEMORY = 500 // Safety cap to prevent unbounded growth

export function useWhaleData(timeframe = '1h', flowTypes = null, symbol = '통합') {
  const [allWhales, setAllWhales] = useState([]) // Store timeframe-based data with buffer
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Client-side filtering based on timeframe, flow_type, and symbol
  const whales = useMemo(() => {
    const now = Date.now()
    const cutoff = now - TIMEFRAME_DURATIONS_MS[timeframe]

    const filtered = allWhales.filter((whale) => {
      const whaleTime = whale.timestamp * 1000 // Convert to milliseconds
      const timeMatch = whaleTime >= cutoff

      // If flowTypes specified, filter by flow_type (e.g., ['inflow', 'outflow'] for dashboard)
      // If null, accept all types (for whale alerts page)
      const flowMatch = !flowTypes || flowTypes.includes(whale.flow_type)

      // Symbol filter: '통합' shows all, otherwise match exact symbol (case-insensitive)
      const symbolMatch = symbol === '통합' || whale.symbol.toUpperCase() === symbol.toUpperCase()

      return timeMatch && flowMatch && symbolMatch
    })

    return filtered
  }, [allWhales, timeframe, flowTypes, symbol])

  useEffect(() => {
    let channel
    let cleanupInterval

    async function fetchWhales() {
      try {
        setLoading(true)
        setError(null)

        // Performance optimization (2025-11-22): Fetch only timeframe × BUFFER_MULTIPLIER
        // Example: 1h timeframe → fetch 2h of data (not 30 days)
        const timeframeDuration = TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['1h']
        const fetchWindow = timeframeDuration * BUFFER_MULTIPLIER
        const cutoffTimestamp = Math.floor((Date.now() - fetchWindow) / 1000)

        // Build query with optional symbol filter
        let query = supabase
          .from('whale_events')
          .select('*')
          .gte('timestamp', cutoffTimestamp)
          // (2025-11-23: Renamed flow types - inflow/outflow instead of buy/sell)
          .gte('amount_usd', MIN_WHALE_USD)  // Tier 1+ filter ($10M+)

        // Add symbol filter only if not '통합' (ALL)
        if (symbol !== '통합') {
          query = query.eq('symbol', symbol.toUpperCase())  // DB stores uppercase symbols
        }

        // Dynamic limit based on symbol filter (2025-11-23: Fix ALL filter showing incomplete data)
        const queryLimit = symbol === '통합' ? 1000 : 200

        // Add timeout to prevent infinite hanging
        const queryPromise = query
          .order('timestamp', { ascending: false })
          .limit(queryLimit)  // 통합: 1000개, 특정 심볼: 200개

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
        )

        const { data, error: fetchError } = await Promise.race([queryPromise, timeoutPromise])

        if (fetchError) {
          console.error('❌ [useWhaleData] Supabase error:', fetchError)
          throw fetchError
        }

        setAllWhales(data || [])
        const symbolLabel = symbol === '통합' ? 'ALL' : symbol
        console.log(`✅ Fetched ${data?.length || 0} whales (${timeframe} × ${BUFFER_MULTIPLIER} window, ${symbolLabel})`)
      } catch (err) {
        console.error('❌ [useWhaleData] Error fetching whales:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchWhales()

    // Subscribe to real-time updates
    // Use unique channel name per symbol/timeframe to avoid multiple subscriptions
    channel = supabase
      .channel(`whale-realtime-${timeframe}-${symbol}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whale_events'
        },
        (payload) => {
          console.log('🐋 New whale detected:', payload.new)

          // Only add whales above $10M threshold (Tier 1+) - all flow types accepted (2025-11-21)
          if (payload.new.amount_usd >= MIN_WHALE_USD) {
            // Check symbol match (2025-11-23: symbol filter - DB uses uppercase)
            const symbolMatch = symbol === '통합' || payload.new.symbol.toUpperCase() === symbol.toUpperCase()

            if (!symbolMatch) {
              console.log(`⏭️  Whale symbol mismatch: ${payload.new.symbol} (need ${symbol})`)
              return
            }

            const whaleTime = payload.new.timestamp * 1000
            const now = Date.now()
            const timeframeDuration = TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['1h']
            const fetchWindow = timeframeDuration * BUFFER_MULTIPLIER

            // Only add if within current fetch window (2025-11-22: optimized from 30 days)
            if (now - whaleTime <= fetchWindow) {
              setAllWhales((prev) => {
                const updated = [payload.new, ...prev]
                // Enforce max limit to prevent memory leaks
                if (updated.length > MAX_WHALES_IN_MEMORY) {
                  console.warn(`⚠️ Whale limit reached (${MAX_WHALES_IN_MEMORY}), removing oldest`)
                  return updated.slice(0, MAX_WHALES_IN_MEMORY)
                }
                return updated
              })
              console.log(`💰 Tier 1+ whale: $${(payload.new.amount_usd / 1e6).toFixed(1)}M ${payload.new.flow_type}`)
            } else {
              console.log('⏭️  Whale outside timeframe window, skipping')
            }
          } else {
            console.log(`🦐 Whale too small: $${(payload.new.amount_usd / 1e6).toFixed(1)}M (need $10M+)`)
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    // Cleanup old whales every 5 minutes (2025-11-22: optimized to timeframe-based)
    cleanupInterval = setInterval(() => {
      const now = Date.now()
      const timeframeDuration = TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['1h']
      const fetchWindow = timeframeDuration * BUFFER_MULTIPLIER
      const cutoffTime = now - fetchWindow

      setAllWhales((prev) => {
        const filtered = prev.filter((whale) => {
          const whaleTime = whale.timestamp * 1000
          return whaleTime >= cutoffTime
        })

        const removed = prev.length - filtered.length
        if (removed > 0) {
          console.log(`🗑️  Cleaned up ${removed} old whales (outside ${timeframe} × ${BUFFER_MULTIPLIER} window)`)
        }

        return filtered
      })
    }, 5 * 60 * 1000) // Every 5 minutes

    // Cleanup
    return () => {
      const symbolLabel = symbol === '통합' ? 'ALL' : symbol
      console.log(`🧹 Cleaning up whale subscription (${timeframe}/${symbolLabel})`)
      if (channel) {
        supabase.removeChannel(channel)
      }
      if (cleanupInterval) {
        clearInterval(cleanupInterval)
      }
      // Clear whale data to free memory
      setAllWhales([])
    }
  }, [timeframe, symbol]) // Re-fetch when timeframe or symbol changes (2025-11-23: added symbol filter)

  return { whales, loading, error }
}
