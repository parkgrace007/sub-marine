import express from 'express'
import rateLimit from 'express-rate-limit'
import supabase from '../utils/supabase.js'

const router = express.Router()

// Rate limiter for alerts API
const alertsApiLimiter = rateLimit({
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

// In-memory cache (30 seconds TTL)
const cache = new Map()
const CACHE_TTL = 30 * 1000 // 30 seconds

function getCacheKey(type, params = {}) {
  return `${type}_${JSON.stringify(params)}`
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
 * GET /api/alerts
 * Fetch alerts with optional filters
 * Query params:
 *   - limit: number of alerts to fetch (default: 50)
 *   - tier: filter by tier (S, A, B, C)
 *   - signal_type: filter by signal type
 */
router.get('/', alertsApiLimiter, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const tier = req.query.tier
    const signalType = req.query.signal_type

    console.log(`🔔 [AlertsAPI] Request: limit=${limit}, tier=${tier || 'all'}, signal_type=${signalType || 'all'}`)

    // Check cache
    const cacheKey = getCacheKey('alerts', { limit, tier, signalType })
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
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })

    // Add filters
    if (tier) {
      query = query.eq('tier', tier)
    }
    if (signalType) {
      query = query.eq('signal_type', signalType)
    }

    // Execute query
    const startTime = Date.now()
    const { data, error: queryError } = await query.limit(limit)
    const duration = Date.now() - startTime

    if (queryError) {
      console.error('❌ [AlertsAPI] Query error:', queryError)
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
    console.error('❌ [AlertsAPI] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/alerts/indicators
 * Fetch indicator alerts with optional filters
 * Query params:
 *   - timeframe: filter by timeframe (1h, 4h, etc.)
 *   - symbol: filter by symbol (BTC, ETH, etc.)
 *   - limit: number of alerts to fetch (default: 100)
 */
router.get('/indicators', alertsApiLimiter, async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '1h'
    const symbol = req.query.symbol || 'BTC'
    const limit = parseInt(req.query.limit) || 100

    console.log(`📊 [AlertsAPI/Indicators] Request: timeframe=${timeframe}, symbol=${symbol}, limit=${limit}`)

    // Check cache
    const cacheKey = getCacheKey('indicator_alerts', { timeframe, symbol, limit })
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

    // Build query
    let query = supabase
      .from('indicator_alerts')
      .select('*')
      .order('created_at', { ascending: false })

    // Add filters
    if (timeframe) {
      query = query.eq('timeframe', timeframe)
    }
    if (symbol) {
      query = query.eq('symbol', symbol)
    }

    // Execute query
    const startTime = Date.now()
    const { data, error: queryError } = await query.limit(limit)
    const duration = Date.now() - startTime

    if (queryError) {
      console.error('❌ [AlertsAPI/Indicators] Query error:', queryError)
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
    console.error('❌ [AlertsAPI/Indicators] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/alerts/indicators
 * Create a new indicator alert
 * Body: { timeframe, symbol, type, message, value }
 */
router.post('/indicators', alertsApiLimiter, async (req, res) => {
  try {
    const { timeframe, symbol, type, message, value } = req.body

    if (!timeframe || !symbol || !type || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: timeframe, symbol, type, message'
      })
    }

    console.log(`📊 [AlertsAPI/Indicators] Creating alert: ${type} for ${symbol}/${timeframe}`)

    const startTime = Date.now()
    const { data, error: insertError } = await supabase
      .from('indicator_alerts')
      .insert({
        timeframe,
        symbol,
        type,
        message,
        value: value || null
      })
      .select()
      .single()

    const duration = Date.now() - startTime

    if (insertError) {
      console.error('❌ [AlertsAPI/Indicators] Insert error:', insertError)
      return res.status(500).json({
        success: false,
        error: insertError.message
      })
    }

    console.log(`   ✅ Alert created in ${duration}ms, id=${data.id}`)

    res.json({
      success: true,
      data: data,
      queryTime: duration,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('❌ [AlertsAPI/Indicators] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/alerts/indicators/stream
 * Server-Sent Events for real-time indicator alert updates
 */
router.get('/indicators/stream', (req, res) => {
  const timeframe = req.query.timeframe
  const symbol = req.query.symbol

  console.log(`🔴 [SSE/Indicators] Client connected: timeframe=${timeframe || 'all'}, symbol=${symbol || 'all'}`)

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  // Send initial connection event
  res.write('event: connected\ndata: {"status":"connected"}\n\n')

  // Subscribe to Supabase Realtime
  const channel = supabase
    .channel(`indicator-alerts-sse-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'indicator_alerts'
      },
      (payload) => {
        const alert = payload.new

        // Filter by timeframe if specified
        if (timeframe && alert.timeframe !== timeframe) return

        // Filter by symbol if specified (allow '통합' to receive all)
        if (symbol && symbol !== '통합' && alert.symbol !== symbol) return

        console.log(`📊 [SSE/Indicators] New alert: ${alert.type} for ${alert.symbol}/${alert.timeframe}`)

        // Send to client
        res.write(`event: indicator_alert\ndata: ${JSON.stringify(alert)}\n\n`)
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
    console.log(`🔴 [SSE/Indicators] Client disconnected`)
    clearInterval(heartbeat)
    if (channel) {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  })
})

/**
 * GET /api/alerts/stream
 * Server-Sent Events for real-time alert updates
 */
router.get('/stream', (req, res) => {
  const tier = req.query.tier
  const signalType = req.query.signal_type

  console.log(`🔴 [SSE/Alerts] Client connected: tier=${tier || 'all'}, signal_type=${signalType || 'all'}`)

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

  // Send initial connection event
  res.write('event: connected\ndata: {"status":"connected"}\n\n')

  // Subscribe to Supabase Realtime
  const channel = supabase
    .channel(`alerts-sse-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts'
      },
      (payload) => {
        const alert = payload.new

        // Filter by tier if specified
        if (tier && alert.tier !== tier) return

        // Filter by signal_type if specified
        if (signalType && alert.signal_type !== signalType) return

        console.log(`🔔 [SSE/Alerts] New alert: [${alert.tier}] ${alert.signal_type}`)

        // Send to client
        res.write(`event: alert\ndata: ${JSON.stringify(alert)}\n\n`)
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
    console.log(`🔴 [SSE/Alerts] Client disconnected`)
    clearInterval(heartbeat)
    if (channel) {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  })
})

/**
 * GET /api/alerts/health
 * Health check for alerts API
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now()

    // Quick query to check connection
    const { count, error } = await supabase
      .from('alerts')
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
