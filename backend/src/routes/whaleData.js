import express from 'express'
import rateLimit from 'express-rate-limit'
import supabase from '../utils/supabase.js'

const router = express.Router()

// Rate limiter for whale API
const whaleApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Timeframe durations in milliseconds
const TIMEFRAME_DURATIONS_MS = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '8h': 8 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000
}

// Constants
const BUFFER_MULTIPLIER = 1.5
const MIN_WHALE_USD = 10_000_000 // $10M threshold

// In-memory cache (30 seconds TTL)
const cache = new Map()
const CACHE_TTL = 30 * 1000 // 30 seconds

function getCacheKey(timeframe, symbol, flowTypes) {
  return `${timeframe}_${symbol}_${flowTypes?.join(',') || 'all'}`
}

function getFromCache(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry
}

function setCache(key, data) {
  // Limit cache size
  if (cache.size >= 20) {
    const oldestKey = cache.keys().next().value
    cache.delete(oldestKey)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

/**
 * GET /api/whales
 * Fetch whale events with filters
 * Query params:
 *   - timeframe: 1h, 4h, 8h, 12h, 1d (default: 8h)
 *   - symbol: BTC, ETH, or 통합 for all (default: 통합)
 *   - flowTypes: comma-separated list (default: inflow,outflow)
 *   - noTimeframe: 'true' to fetch latest N records without time restriction
 *   - limit: number of records to fetch (default: 300 for noTimeframe mode)
 */
router.get('/', whaleApiLimiter, async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '8h'
    const symbol = req.query.symbol || '통합'
    const flowTypesParam = req.query.flowTypes || 'inflow,outflow'
    const flowTypes = flowTypesParam.split(',').filter(Boolean)
    const noTimeframe = req.query.noTimeframe === 'true'
    const requestedLimit = parseInt(req.query.limit) || (noTimeframe ? 300 : null)

    console.log(`🐋 [WhaleAPI] Request: timeframe=${timeframe}, symbol=${symbol}, flowTypes=${flowTypes.join(',')}, noTimeframe=${noTimeframe}`)

    // Check cache
    const cacheKey = noTimeframe
      ? `latest_${requestedLimit}_${symbol}_${flowTypes?.join(',') || 'all'}`
      : getCacheKey(timeframe, symbol, flowTypes)
    const cached = getFromCache(cacheKey)
    if (cached) {
      console.log(`   ✅ Cache hit (${Math.floor((Date.now() - cached.timestamp) / 1000)}s old)`)
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
        timestamp: cached.timestamp
      })
    }

    // Build query - SERVICE_ROLE key bypasses RLS
    let query = supabase
      .from('whale_events')
      .select('id, timestamp, symbol, amount_usd, flow_type, blockchain, from_owner, to_owner, from_owner_type, to_owner_type, from_address, to_address')
      .gte('amount_usd', MIN_WHALE_USD)

    // Only apply time filter if NOT in noTimeframe mode
    if (!noTimeframe) {
      const timeframeDuration = TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['8h']
      const fetchWindow = timeframeDuration * BUFFER_MULTIPLIER
      const cutoffTimestamp = Math.floor((Date.now() - fetchWindow) / 1000)
      query = query.gte('timestamp', cutoffTimestamp)
    }

    // Add flow_type filter
    if (flowTypes && flowTypes.length > 0) {
      query = query.in('flow_type', flowTypes)
    }

    // Add symbol filter
    if (symbol !== '통합') {
      query = query.eq('symbol', symbol.toUpperCase())
    }

    // Execute query
    const queryLimit = requestedLimit || (symbol === '통합' ? 500 : 100)
    const startTime = Date.now()

    const { data, error: queryError } = await query
      .order('timestamp', { ascending: false })
      .limit(queryLimit)

    const duration = Date.now() - startTime

    if (queryError) {
      console.error('❌ [WhaleAPI] Query error:', queryError)
      return res.status(500).json({
        success: false,
        error: queryError.message
      })
    }

    console.log(`   ✅ Query completed in ${duration}ms, ${data?.length || 0} records`)

    // Cache result
    setCache(cacheKey, data || [])

    res.json({
      success: true,
      data: data || [],
      cached: false,
      queryTime: duration,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('❌ [WhaleAPI] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/whales/stream
 * Server-Sent Events for real-time whale updates
 */
router.get('/stream', (req, res) => {
  const timeframe = req.query.timeframe || '8h'
  const symbol = req.query.symbol || '통합'
  const flowTypesParam = req.query.flowTypes || 'inflow,outflow'
  const flowTypes = flowTypesParam.split(',').filter(Boolean)

  console.log(`🔴 [SSE] Client connected: timeframe=${timeframe}, symbol=${symbol}`)

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

  // Send initial connection event
  res.write('event: connected\ndata: {"status":"connected"}\n\n')

  // Subscribe to Supabase Realtime
  const channel = supabase
    .channel(`whale-sse-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'whale_events'
      },
      (payload) => {
        const whale = payload.new

        // Filter by amount
        if (whale.amount_usd < MIN_WHALE_USD) return

        // Filter by flow_type
        if (!flowTypes.includes(whale.flow_type)) return

        // Filter by symbol
        if (symbol !== '통합' && whale.symbol.toUpperCase() !== symbol.toUpperCase()) return

        // Check timestamp is within window
        const timeframeDuration = TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['8h']
        const fetchWindow = timeframeDuration * BUFFER_MULTIPLIER
        const whaleTime = whale.timestamp * 1000
        if (Date.now() - whaleTime > fetchWindow) return

        console.log(`🐋 [SSE] New whale: $${(whale.amount_usd / 1e6).toFixed(1)}M ${whale.flow_type}`)

        // Send to client
        res.write(`event: whale\ndata: ${JSON.stringify(whale)}\n\n`)
      }
    )
    .subscribe((status) => {
      console.log(`   Realtime subscription: ${status}`)
    })

  // Heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: {"time":${Date.now()}}\n\n`)
  }, 30000)

  // Cleanup on client disconnect
  req.on('close', () => {
    console.log(`🔴 [SSE] Client disconnected`)
    clearInterval(heartbeat)
    if (channel) {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  })
})

/**
 * GET /api/whales/health
 * Health check for whale API
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now()

    // Quick query to check connection
    const { count, error } = await supabase
      .from('whale_events')
      .select('*', { count: 'exact', head: true })

    const duration = Date.now() - startTime

    if (error) {
      return res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error.message
      })
    }

    res.json({
      success: true,
      status: 'healthy',
      rowCount: count,
      queryTime: duration,
      cacheSize: cache.size
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message
    })
  }
})

export default router
