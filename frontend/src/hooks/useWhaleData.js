import { useState, useEffect, useMemo } from 'react'
import { TIMEFRAME_DURATIONS_MS } from '../config/timeframes'

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Constants
const MAX_WHALES_IN_MEMORY = 300

export function useWhaleData(timeframe = '1h', flowTypes = null, symbol = '통합') {
  const [allWhales, setAllWhales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  // Client-side filtering: ONLY timeframe trimming
  const whales = useMemo(() => {
    const now = Date.now()
    const cutoff = now - TIMEFRAME_DURATIONS_MS[timeframe]

    const filtered = allWhales.filter((whale) => {
      const whaleTime = whale.timestamp * 1000
      return whaleTime >= cutoff
    })

    return filtered
  }, [allWhales, timeframe])

  useEffect(() => {
    let eventSource = null
    let cleanupInterval = null
    let reconnectTimeout = null

    async function fetchWhales() {
      try {
        console.log('🔍 [useWhaleData] Fetching via Backend API...')
        console.log(`   Timeframe: ${timeframe}, Symbol: ${symbol}, FlowTypes: ${flowTypes?.join('/')}`)

        setLoading(true)
        setError(null)

        // Build query params
        const params = new URLSearchParams({
          timeframe,
          symbol,
          flowTypes: flowTypes?.join(',') || 'inflow,outflow'
        })

        const startTime = Date.now()
        const response = await fetch(`${API_URL}/api/whales?${params}`)

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const json = await response.json()
        const duration = Date.now() - startTime

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch whales')
        }

        console.log(`✅ [useWhaleData] Fetched ${json.data?.length || 0} whales in ${duration}ms`)
        console.log(`   Cached: ${json.cached}, Cache age: ${json.cacheAge || 0}s`)

        setAllWhales(json.data || [])
      } catch (err) {
        console.error('❌ [useWhaleData] Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    function connectSSE() {
      // Build query params
      const params = new URLSearchParams({
        timeframe,
        symbol,
        flowTypes: flowTypes?.join(',') || 'inflow,outflow'
      })

      console.log('🔴 [SSE] Connecting to whale stream...')

      eventSource = new EventSource(`${API_URL}/api/whales/stream?${params}`)

      eventSource.addEventListener('connected', (event) => {
        console.log('✅ [SSE] Connected to whale stream')
      })

      eventSource.addEventListener('whale', (event) => {
        try {
          const whale = JSON.parse(event.data)
          console.log(`🐋 [SSE] New whale: $${(whale.amount_usd / 1e6).toFixed(1)}M ${whale.flow_type}`)

          setAllWhales((prev) => {
            // Check for duplicate
            if (prev.some(w => w.id === whale.id)) {
              return prev
            }

            const updated = [whale, ...prev]
            if (updated.length > MAX_WHALES_IN_MEMORY) {
              return updated.slice(0, MAX_WHALES_IN_MEMORY)
            }
            return updated
          })
        } catch (e) {
          console.error('❌ [SSE] Parse error:', e)
        }
      })

      eventSource.addEventListener('ping', () => {
        // Heartbeat received
      })

      eventSource.onerror = (err) => {
        console.error('❌ [SSE] Error:', err)

        // Close current connection
        if (eventSource) {
          eventSource.close()
          eventSource = null
        }

        // Reconnect after 5 seconds
        console.log('🔄 [SSE] Reconnecting in 5s...')
        reconnectTimeout = setTimeout(connectSSE, 5000)
      }
    }

    // Initial fetch
    fetchWhales()

    // Connect to SSE stream
    connectSSE()

    // Cleanup old whales every 5 minutes
    cleanupInterval = setInterval(() => {
      const now = Date.now()
      const timeframeDuration = TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['1h']
      const fetchWindow = timeframeDuration * 1.5
      const cutoffTime = now - fetchWindow

      setAllWhales((prev) => {
        const filtered = prev.filter((whale) => {
          const whaleTime = whale.timestamp * 1000
          return whaleTime >= cutoffTime
        })

        const removed = prev.length - filtered.length
        if (removed > 0) {
          console.log(`🗑️ Cleaned up ${removed} old whales`)
        }

        return filtered
      })
    }, 5 * 60 * 1000)

    // Cleanup - only close connections, keep data to prevent flickering
    return () => {
      console.log('🧹 [useWhaleData] Cleaning up SSE connection...')

      if (eventSource) {
        eventSource.close()
        eventSource = null
      }

      if (cleanupInterval) {
        clearInterval(cleanupInterval)
      }

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }

      // Don't clear allWhales here - causes data to disappear on filter change
      // Data will be replaced by fresh fetch when new effect runs
    }
  }, [timeframe, symbol, refetchTrigger])

  const refetch = () => {
    console.log('🔄 [useWhaleData] Manual refetch triggered')
    setRefetchTrigger(prev => prev + 1)
  }

  return { whales, loading, error, refetch }
}
