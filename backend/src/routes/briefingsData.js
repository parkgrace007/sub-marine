import express from 'express'
import rateLimit from 'express-rate-limit'
import supabase from '../utils/supabase.js'

const router = express.Router()

// Rate limiter for briefings API
const briefingsApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// In-memory cache (60 seconds TTL - briefings don't change often)
const cache = new Map()
const CACHE_TTL = 60 * 1000 // 60 seconds

function getCacheKey(type) {
  return type
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
  if (cache.size >= 10) {
    const oldestKey = cache.keys().next().value
    cache.delete(oldestKey)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

/**
 * GET /api/briefings/latest
 * Fetch the latest market briefing
 */
router.get('/latest', briefingsApiLimiter, async (req, res) => {
  try {
    console.log(`📰 [BriefingsAPI] Request: latest briefing`)

    // Check cache
    const cacheKey = getCacheKey('latest_briefing')
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

    // Execute query - SERVICE_ROLE key bypasses RLS
    const startTime = Date.now()
    const { data, error: queryError } = await supabase
      .from('market_briefings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const duration = Date.now() - startTime

    if (queryError) {
      // PGRST116 means no rows found - not an error, just empty
      if (queryError.code === 'PGRST116') {
        console.log(`   ℹ️ No briefings found yet`)
        return res.json({
          success: true,
          data: null,
          cached: false,
          queryTime: duration,
          timestamp: Date.now()
        })
      }

      console.error('❌ [BriefingsAPI] Query error:', queryError)
      return res.status(500).json({
        success: false,
        error: queryError.message
      })
    }

    console.log(`   ✅ Query completed in ${duration}ms`)

    // Cache result
    setCache(cacheKey, data)

    res.json({
      success: true,
      data: data,
      cached: false,
      queryTime: duration,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('❌ [BriefingsAPI] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/briefings/list
 * Fetch multiple briefings
 * Query params:
 *   - limit: number of briefings to fetch (default: 10)
 */
router.get('/list', briefingsApiLimiter, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10

    console.log(`📰 [BriefingsAPI] Request: list, limit=${limit}`)

    // Check cache
    const cacheKey = getCacheKey(`briefings_list_${limit}`)
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

    // Execute query
    const startTime = Date.now()
    const { data, error: queryError } = await supabase
      .from('market_briefings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    const duration = Date.now() - startTime

    if (queryError) {
      console.error('❌ [BriefingsAPI] Query error:', queryError)
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
    console.error('❌ [BriefingsAPI] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/briefings/stream
 * Server-Sent Events for real-time briefing updates
 */
router.get('/stream', (req, res) => {
  console.log(`🔴 [SSE/Briefings] Client connected`)

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

  // Send initial connection event
  res.write('event: connected\ndata: {"status":"connected"}\n\n')

  // Subscribe to Supabase Realtime
  const channel = supabase
    .channel(`briefings-sse-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'market_briefings'
      },
      (payload) => {
        const briefing = payload.new

        console.log(`📰 [SSE/Briefings] New briefing received`)

        // Send to client
        res.write(`event: briefing\ndata: ${JSON.stringify(briefing)}\n\n`)
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
    console.log(`🔴 [SSE/Briefings] Client disconnected`)
    clearInterval(heartbeat)
    if (channel) {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  })
})

/**
 * GET /api/briefings/health
 * Health check for briefings API
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now()

    // Quick query to check connection
    const { count, error } = await supabase
      .from('market_briefings')
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
