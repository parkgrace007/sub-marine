import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { TIMEFRAME_DURATIONS_MS } from '../config/timeframes'

// Performance optimization (2025-11-22): Fetch only timeframe-relevant data instead of 30 days
const BUFFER_MULTIPLIER = 2 // Fetch 2x timeframe duration for safety margin (1h → 2h, 4h → 8h)
const MIN_WHALE_USD = 10_000_000 // $10M threshold for Tier 1+ whales (2025-11-19: synchronized with Whale Alert API)
const MAX_WHALES_IN_MEMORY = 300 // OPTIMIZATION (2025-11-24): Reduced from 500 due to better filtering

export function useWhaleData(timeframe = '1h', flowTypes = null, symbol = '통합') {
  const [allWhales, setAllWhales] = useState([]) // Store timeframe-based data with buffer
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

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
        console.log('🔍 [DIAGNOSTIC] Starting fetchWhales...')
        console.log(`   Timeframe: ${timeframe}, Symbol: ${symbol}, FlowTypes: ${flowTypes?.join('/')}`)

        setLoading(true)
        setError(null)

        // Performance optimization (2025-11-22): Fetch only timeframe × BUFFER_MULTIPLIER
        // Example: 1h timeframe → fetch 2h of data (not 30 days)
        const timeframeDuration = TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['1h']
        const fetchWindow = timeframeDuration * BUFFER_MULTIPLIER
        const cutoffTimestamp = Math.floor((Date.now() - fetchWindow) / 1000)
        console.log(`   Fetch window: ${fetchWindow}ms, Cutoff timestamp: ${cutoffTimestamp}`)

        // Build query with optional symbol filter
        // OPTIMIZATION (2025-11-24): Select only needed columns (40% data reduction)
        console.log('🔍 [DIAGNOSTIC] Building Supabase query...')
        let query = supabase
          .from('whale_events')
          .select('id, timestamp, symbol, amount_usd, flow_type, blockchain, from_owner_type, to_owner_type, from_address, to_address')
          .gte('timestamp', cutoffTimestamp)
          // Flow types: inflow, outflow, internal, exchange, defi
          .gte('amount_usd', MIN_WHALE_USD)  // Tier 1+ filter ($10M+)

        // Add flow_type filter if specified (2025-11-24: CRITICAL FIX for production performance)
        // Filter at DB level instead of client-side to reduce data transfer
        if (flowTypes && flowTypes.length > 0) {
          query = query.in('flow_type', flowTypes)
          console.log(`   Applied flow_type filter: ${flowTypes.join(', ')}`)
        }

        // Add symbol filter only if not '통합' (ALL)
        if (symbol !== '통합') {
          query = query.eq('symbol', symbol.toUpperCase())  // DB stores uppercase symbols
          console.log(`   Applied symbol filter: ${symbol}`)
        }

        // Dynamic limit based on symbol filter (2025-11-23: Fix ALL filter showing incomplete data)
        // OPTIMIZATION (2025-11-24): Reduced limits since flow_type filter already cuts data by 70%
        const queryLimit = symbol === '통합' ? 500 : 100
        console.log(`   Query limit: ${queryLimit}`)

        // Add timeout to prevent infinite hanging
        console.log('🔍 [DIAGNOSTIC] Executing query with 30s timeout...')
        const queryStartTime = Date.now()

        const queryPromise = query
          .order('timestamp', { ascending: false })
          .limit(queryLimit)  // 통합: 1000개, 특정 심볼: 200개

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout after 30 seconds')), 30000)
        )

        const { data, error: fetchError } = await Promise.race([queryPromise, timeoutPromise])

        const queryDuration = Date.now() - queryStartTime
        console.log(`🔍 [DIAGNOSTIC] Query completed in ${queryDuration}ms`)

        if (fetchError) {
          console.error('❌ [DIAGNOSTIC] Supabase query error:', fetchError)
          console.error('   Error details:', JSON.stringify(fetchError, null, 2))
          throw fetchError
        }

        console.log(`🔍 [DIAGNOSTIC] Query succeeded! Received ${data?.length || 0} records`)
        console.log(`   Data size: ${JSON.stringify(data).length} bytes`)

        setAllWhales(data || [])
        const symbolLabel = symbol === '통합' ? 'ALL' : symbol
        console.log(`✅ [DIAGNOSTIC] Fetched ${data?.length || 0} whales (${timeframe} × ${BUFFER_MULTIPLIER} window, ${symbolLabel})`)
        console.log('🔍 [DIAGNOSTIC] fetchWhales completed successfully')
      } catch (err) {
        console.error('❌ [DIAGNOSTIC] Error in fetchWhales:', err)
        console.error('   Error name:', err.name)
        console.error('   Error message:', err.message)
        console.error('   Error stack:', err.stack)
        setError(err.message)
      } finally {
        console.log('🔍 [DIAGNOSTIC] Setting loading to false')
        setLoading(false)
      }
    }

    // Initial fetch
    fetchWhales()

    // ===== DIAGNOSTIC (2025-11-24): Realtime TEMPORARILY DISABLED =====
    // Testing if WebSocket connection is causing production timeout
    // If data loads successfully without this, issue is Realtime WebSocket
    // If still times out, issue is REST API or network routing
    // TODO: Re-enable after diagnostic test completes

    console.log('⚠️ DIAGNOSTIC MODE: Realtime subscription DISABLED for timeout isolation test')

    /* TEMPORARILY COMMENTED OUT FOR DIAGNOSTIC
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
            // OPTIMIZATION (2025-11-24): Filter by flow_type in realtime subscription
            const flowMatch = !flowTypes || flowTypes.includes(payload.new.flow_type)
            if (!flowMatch) {
              console.log(`⏭️  Whale flow_type mismatch: ${payload.new.flow_type} (need ${flowTypes?.join('/')})`)
              return
            }

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
    END DIAGNOSTIC COMMENT */

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
      console.log(`🧹 [DIAGNOSTIC] Cleaning up (${timeframe}/${symbolLabel})`)
      if (channel) {
        console.log('   Removing Realtime channel')
        supabase.removeChannel(channel)
      } else {
        console.log('   No Realtime channel to remove (diagnostic mode)')
      }
      if (cleanupInterval) {
        console.log('   Clearing cleanup interval')
        clearInterval(cleanupInterval)
      }
      // Clear whale data to free memory
      setAllWhales([])
      console.log('   Cleanup complete')
    }
  }, [timeframe, symbol, refetchTrigger]) // Re-fetch when timeframe, symbol, or refetchTrigger changes

  // Refetch function to manually trigger data reload
  const refetch = () => {
    console.log('🔄 [useWhaleData] Manual refetch triggered')
    setRefetchTrigger(prev => prev + 1)
  }

  return { whales, loading, error, refetch }
}
