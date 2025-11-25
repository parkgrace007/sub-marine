import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import crypto from 'crypto'
import axios from 'axios'
import whaleAlertService from './services/whaleAlert.js'
import WhaleRestFallback from './services/whaleRestFallback.js'
import scheduler from './services/scheduler.js'
import { getLunarCrushData, clearCache as clearLunarCache } from './services/lunarcrush.js'
import { getNewsAPIData, clearCache as clearNewsCache, getNextRefreshTime, cleanupExistingArticles } from './services/newsapi.js'
import adminRouter from './routes/admin.js'
import diagnosticRouter from './routes/diagnostic.js'
import whaleDataRouter from './routes/whaleData.js'
import alertsDataRouter from './routes/alertsData.js'
import briefingsDataRouter from './routes/briefingsData.js'
import metricsCollector from './services/metricsCollector.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// CORS Configuration (Security Enhancement)
const corsOptions = {
  origin: function (origin, callback) {
    // Allowed origins based on environment
    // Production: Use ALLOWED_ORIGINS env var (comma-separated) or default list
    // Development: Use localhost variants
    let allowedOrigins

    if (process.env.NODE_ENV === 'production') {
      // Check for custom ALLOWED_ORIGINS environment variable
      if (process.env.ALLOWED_ORIGINS) {
        // Parse comma-separated list of origins
        allowedOrigins = process.env.ALLOWED_ORIGINS
          .split(',')
          .map(origin => origin.trim())
          .filter(Boolean)
        console.log('🔒 [CORS] Using custom allowed origins from env:', allowedOrigins)
      } else {
        // Fallback to default production origins
        allowedOrigins = [
          'https://submarine-frontend-vb92.onrender.com',  // Frontend URL
          'https://submarine-ch8s.onrender.com',           // Backend URL (for admin)
          'https://submarine.app',
          'https://www.submarine.app'
        ].filter(Boolean)
        console.log('🔒 [CORS] Using default allowed origins:', allowedOrigins)
      }
    } else {
      // Development: Allow localhost variants
      allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ]
    }

    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS policy: Origin ${origin} is not allowed`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
  optionsSuccessStatus: 200
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json())

// Metrics tracking middleware (track all API calls)
app.use((req, res, next) => {
  const startTime = Date.now()

  // Capture original res.json to measure response time
  const originalJson = res.json.bind(res)
  res.json = function(body) {
    const duration = Date.now() - startTime
    metricsCollector.trackApiCall(req, res, duration)
    return originalJson(body)
  }

  next()
})

// Rate limiter for manual trigger APIs (5 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 requests per window
  message: {
    success: false,
    error: 'Too many API trigger requests. Maximum 5 requests per 15 minutes allowed.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false // Disable `X-RateLimit-*` headers
})

// Security Enhancement: Public API Rate Limiters
const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requests per 15 minutes
  message: {
    error: 'Too many requests from this IP. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
  }
})

const realtimeApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Maximum 60 requests per minute (1 per second)
  message: {
    error: 'Too many realtime requests. Please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
})

const healthCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Maximum 10 requests per minute
  message: {
    error: 'Too many health check requests.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Admin token authentication middleware (Security Enhanced: Timing-Safe Comparison)
function requireAdminToken(req, res, next) {
  const token = req.headers['x-admin-token']
  const expectedToken = process.env.ADMIN_TOKEN

  // Input validation
  if (!token || typeof token !== 'string') {
    return res.status(401).json({
      success: false,
      error: 'Admin token required. Set x-admin-token header with your ADMIN_TOKEN.'
    })
  }

  // Length check (prevents timing attacks on length differences)
  if (token.length !== expectedToken.length) {
    console.warn('⚠️ Invalid admin token attempt from IP:', req.ip, '(length mismatch)')
    return res.status(403).json({
      success: false,
      error: 'Invalid admin token'
    })
  }

  // Timing-safe comparison using crypto.timingSafeEqual
  try {
    const tokenBuffer = Buffer.from(token, 'utf8')
    const expectedBuffer = Buffer.from(expectedToken, 'utf8')

    if (crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
      next()
    } else {
      console.warn('⚠️ Invalid admin token attempt from IP:', req.ip)
      return res.status(403).json({
        success: false,
        error: 'Invalid admin token'
      })
    }
  } catch (error) {
    // Buffer size mismatch or other errors
    console.warn('⚠️ Admin token comparison error from IP:', req.ip, error.message)
    return res.status(403).json({
      success: false,
      error: 'Invalid admin token'
    })
  }
}

// ===== CryptoPanic Trends Cache =====
// 15-minute caching to avoid rate limiting (free tier has strict limits)
let cryptoTrendsCache = {
  data: {
    posts: [],
    count: 0,
    next: null
  },
  timestamp: 0
}
const CACHE_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// 429 Rate Limit Block State (15-minute cooldown)
let rateLimitBlock = {
  isBlocked: false,
  blockedUntil: 0
}
const RATE_LIMIT_BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// Sentiment analysis function (keyword-based)
function analyzeSentiment(title) {
  const text = title.toLowerCase()

  // Bullish keywords (positive sentiment)
  const bullishKeywords = ['bull', 'surge', 'pump', 'breakout', 'rally', 'moon', 'up', 'rise', 'gain', 'bullish', 'upgrade', 'partnership', 'adoption', 'soar', 'spike', 'green']

  // Bearish keywords (negative sentiment)
  const bearishKeywords = ['bear', 'crash', 'dump', 'drop', 'fall', 'down', 'bearish', 'sell', 'loss', 'hack', 'scam', 'downgrade', 'plunge', 'dive', 'red', 'ban']

  // Check for bullish keywords
  const hasBullish = bullishKeywords.some(keyword => text.includes(keyword))

  // Check for bearish keywords
  const hasBearish = bearishKeywords.some(keyword => text.includes(keyword))

  if (hasBullish && !hasBearish) return 'bullish'
  if (hasBearish && !hasBullish) return 'bearish'
  return 'neutral'
}

// ===== ADMIN ROUTES =====
// Mount admin router (all /api/admin/* routes)
app.use('/api/admin', adminRouter)

// ===== DIAGNOSTIC ROUTES =====
// Mount diagnostic router (all /api/diagnostic/* routes)
// These endpoints help diagnose database connection and deployment issues
app.use('/api/diagnostic', diagnosticRouter)

// ===== WHALE DATA ROUTES =====
// Mount whale data router (proxy for frontend → supabase)
// This bypasses frontend direct connection issues with SERVICE_ROLE key
app.use('/api/whales', whaleDataRouter)

// ===== ALERTS DATA ROUTES =====
// Mount alerts data router (proxy for frontend → supabase)
// Handles both combined alerts and indicator alerts
app.use('/api/alerts', alertsDataRouter)

// ===== BRIEFINGS DATA ROUTES =====
// Mount briefings data router (proxy for frontend → supabase)
// Handles market briefings / deep dive reports
app.use('/api/briefings', briefingsDataRouter)

// Health check endpoint
app.get('/health', healthCheckLimiter, (req, res) => {
  const uptime = process.uptime()
  const whaleStatus = whaleAlertService.getStatus()

  res.json({
    status: 'ok',
    uptime: Math.floor(uptime),
    services: {
      whaleAlert: {
        connected: whaleStatus.connected,
        is429Blocked: whaleStatus.is429Blocked,
        timeUntil429Unblock: whaleStatus.timeUntil429Unblock,
        alertsThisHour: whaleStatus.alertsThisHour,
        reconnectAttempts: whaleStatus.reconnectAttempts
      }
    },
    timestamp: new Date().toISOString()
  })
})

// Status endpoint with detailed info
app.get('/status', healthCheckLimiter, (req, res) => {
  const whaleStatus = whaleAlertService.getStatus()

  // Calculate usage utilization percentage
  const rateLimit = 100  // alerts/hour
  const utilizationPercent = Math.round((whaleStatus.alertsThisHour / rateLimit) * 100)

  // Calculate time until hourly reset
  const now = Date.now()
  const hourlyResetTime = whaleStatus.hourlyResetTime || now + 3600000
  const timeUntilReset = Math.max(0, Math.floor((hourlyResetTime - now) / 1000 / 60))  // minutes

  res.json({
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    },
    whaleAlert: {
      ...whaleStatus,
      rateLimit: `${rateLimit}/hour`,
      utilizationPercent,
      timeUntilReset: `${timeUntilReset} minutes`,
      configuration: {
        blockchains: ['bitcoin', 'ethereum', 'tron', 'ripple'],  // Updated 2025-11-19: Top 4 chains
        min_value_usd: 10000000  // Updated 2025-11-19: $500K → $10M (Tier 1+)
      }
    },
    timestamp: new Date().toISOString()
  })
})

// Manual WhaleAlert reconnect trigger (protected with token auth + rate limiting)
app.post('/api/trigger/whale-reconnect', requireAdminToken, apiLimiter, (req, res) => {
  try {
    console.log('🔌 Manual WhaleAlert reconnect triggered via API')
    const result = whaleAlertService.manualReconnect()

    res.json({
      success: result.success,
      message: result.message
    })
  } catch (error) {
    console.error('❌ WhaleAlert reconnect failed:', error.message)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Manual 429 block reset trigger (protected with token auth + rate limiting)
app.post('/api/trigger/whale-reset-429', requireAdminToken, apiLimiter, (req, res) => {
  try {
    console.log('🔓 Manual 429 block reset triggered via API')
    whaleAlertService.reset429Block()

    res.json({
      success: true,
      message: '429 block reset successfully. You can now manually reconnect using /api/trigger/whale-reconnect'
    })
  } catch (error) {
    console.error('❌ 429 block reset failed:', error.message)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// CryptoPanic Trends API (with 5-minute caching)
app.get('/api/crypto-trends', publicApiLimiter, async (req, res) => {
  try {
    const now = Date.now()

    // Check if rate limit block is active
    if (rateLimitBlock.isBlocked && now < rateLimitBlock.blockedUntil) {
      const minutesLeft = Math.ceil((rateLimitBlock.blockedUntil - now) / 1000 / 60)
      console.log(`⏳ CryptoPanic rate limit blocked (${minutesLeft} minutes left)`)

      // Always return cached data (even if empty) with rate limit info
      return res.json({
        success: true,
        data: cryptoTrendsCache.data,
        cached: true,
        rateLimited: true,
        minutesUntilUnblock: minutesLeft,
        cacheAge: Math.floor((now - cryptoTrendsCache.timestamp) / 1000)
      })
    }

    // Unblock if time has passed
    if (rateLimitBlock.isBlocked && now >= rateLimitBlock.blockedUntil) {
      console.log('✅ CryptoPanic rate limit unblocked - resuming API calls')
      rateLimitBlock.isBlocked = false
      rateLimitBlock.blockedUntil = 0
    }

    // Check cache validity (15 minutes)
    if (cryptoTrendsCache.timestamp > 0 && (now - cryptoTrendsCache.timestamp < CACHE_DURATION_MS)) {
      const cacheAgeMinutes = Math.floor((now - cryptoTrendsCache.timestamp) / 1000 / 60)
      console.log(`✅ CryptoPanic trends (cached, ${cacheAgeMinutes}min old)`)
      return res.json({
        success: true,
        data: cryptoTrendsCache.data,
        cached: true,
        cacheAge: Math.floor((now - cryptoTrendsCache.timestamp) / 1000) // seconds
      })
    }

    // Fetch fresh data from CryptoPanic API
    console.log('🔄 Fetching fresh CryptoPanic trends...')
    const response = await axios.get('https://cryptopanic.com/api/developer/v2/posts/', {
      params: {
        auth_token: process.env.CRYPTOPANIC_API_KEY,
        filter: 'rising',
        public: true,
        kind: 'news' // news, media, or all
      },
      timeout: 10000 // 10 second timeout
    })

    // Analyze sentiment for each post
    const postsWithSentiment = response.data.results.map(post => ({
      ...post,
      sentiment: analyzeSentiment(post.title)
    }))

    // Update cache
    cryptoTrendsCache = {
      data: {
        posts: postsWithSentiment,
        count: postsWithSentiment.length,
        next: response.data.next
      },
      timestamp: now
    }

    console.log(`✅ CryptoPanic trends fetched (${postsWithSentiment.length} posts)`)

    res.json({
      success: true,
      data: cryptoTrendsCache.data,
      cached: false,
      cacheAge: 0
    })
  } catch (error) {
    console.error('❌ CryptoPanic trends fetch error:', error.message)

    // If 429 error, activate rate limit block for 15 minutes
    if (error.response?.status === 429 || error.message.includes('429')) {
      const now = Date.now()
      rateLimitBlock.isBlocked = true
      rateLimitBlock.blockedUntil = now + RATE_LIMIT_BLOCK_DURATION_MS

      console.log('🚫 CryptoPanic rate limit 429 detected - blocking API calls for 15 minutes')
      console.log(`   Blocked until: ${new Date(rateLimitBlock.blockedUntil).toLocaleTimeString()}`)

      // Always return cached data (even if empty) with rate limit info
      return res.json({
        success: true,
        data: cryptoTrendsCache.data,
        cached: true,
        rateLimited: true,
        minutesUntilUnblock: 15,
        cacheAge: Math.floor((now - cryptoTrendsCache.timestamp) / 1000),
        message: 'Rate limit exceeded. Showing cached data. Will retry in 15 minutes.'
      })
    }

    // Return cached data for non-429 errors (network issues, timeouts, etc.)
    console.log('⚠️  CryptoPanic API error - returning cached data')
    return res.json({
      success: true,
      data: cryptoTrendsCache.data,
      cached: true,
      stale: true,
      error: error.message,
      message: 'API temporarily unavailable. Showing cached data.'
    })
  }
})

// ===== LunarCrush API (News & Influencers) =====

/**
 * GET /api/lunarcrush/news
 * Get crypto news and influencers from LunarCrush
 * Query params:
 *   - symbol: Crypto symbol (default: BTC)
 *   - refresh: Force cache refresh (true/false)
 */
app.get('/api/lunarcrush/news', publicApiLimiter, async (req, res) => {
  try {
    const symbol = req.query.symbol || 'BTC'
    const forceRefresh = req.query.refresh === 'true'

    console.log(`🌙 LunarCrush news request for ${symbol} (refresh: ${forceRefresh})`)

    const data = await getLunarCrushData(symbol, forceRefresh)

    const cacheAge = data.timestamp ? Math.floor((Date.now() - data.timestamp) / 1000) : 0

    res.json({
      success: true,
      data: {
        feeds: data.feeds || [],
        influencers: data.influencers || [],
        symbol: data.symbol,
        lastUpdate: data.lastUpdate
      },
      cached: !forceRefresh && cacheAge > 0,
      cacheAge
    })
  } catch (error) {
    console.error('❌ LunarCrush API error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch LunarCrush data'
    })
  }
})

/**
 * POST /api/lunarcrush/refresh
 * Force refresh LunarCrush cache (admin only)
 */
app.post('/api/lunarcrush/refresh', (req, res) => {
  const token = req.headers['x-admin-token']

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - invalid admin token'
    })
  }

  const cleared = clearLunarCache()

  res.json({
    success: true,
    message: cleared ? 'Cache cleared successfully' : 'No cache to clear'
  })
})

// ===== NewsAPI.org (Crypto News) =====

/**
 * GET /api/news
 * Get latest crypto news from Supabase (translated Korean news)
 * No manual refresh - data updates automatically every 12 hours
 */
app.get('/api/news', publicApiLimiter, async (req, res) => {
  try {
    console.log(`📰 NewsAPI request (from Supabase)`)

    const data = await getNewsAPIData(false) // Always fetch from Supabase

    const nextRefresh = await getNextRefreshTime()

    res.json({
      success: true,
      data: {
        articles: data.articles || [],
        lastUpdate: data.lastUpdate,
        totalResults: data.totalResults || 0
      },
      nextRefresh
    })
  } catch (error) {
    console.error('❌ NewsAPI error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch NewsAPI data'
    })
  }
})

/**
 * POST /api/news/refresh
 * Force refresh and translate new articles (admin only)
 */
app.post('/api/news/refresh', async (req, res) => {
  const token = req.headers['x-admin-token']

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - invalid admin token'
    })
  }

  try {
    console.log('🔄 Admin forcing news refresh...')
    const data = await getNewsAPIData(true) // Force refresh

    res.json({
      success: true,
      message: `Refreshed successfully - ${data.totalResults} articles`,
      data: {
        totalResults: data.totalResults,
        lastUpdate: data.lastUpdate
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/news/cleanup
 * Clean up existing database articles using enhanced crypto filter
 * Removes non-crypto articles (admin only)
 */
app.post('/api/news/cleanup', async (req, res) => {
  const token = req.headers['x-admin-token']

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - invalid admin token'
    })
  }

  try {
    console.log('🧹 Admin triggering database cleanup...')
    const result = await cleanupExistingArticles()

    res.json({
      success: true,
      message: `Database cleanup completed - deleted ${result.deleted} non-crypto articles`,
      data: {
        total: result.total,
        deleted: result.deleted,
        kept: result.kept,
        deletedArticles: result.deletedArticles
      }
    })
  } catch (error) {
    console.error('❌ Cleanup error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SubMarine Backend API',
    version: '2.0.0',
    description: 'Whale transaction tracking and alert system',
    endpoints: {
      health: 'GET /health',
      status: 'GET /status',
      cryptoTrends: 'GET /api/crypto-trends',
      triggerWhaleReconnect: 'POST /api/trigger/whale-reconnect',
      triggerWhaleReset429: 'POST /api/trigger/whale-reset-429'
    }
  })
})

// Start server
const server = app.listen(PORT, () => {
  console.log('\n🚀 SubMarine Backend Server Started')
  console.log('━'.repeat(60))
  console.log(`   Port: ${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Health Check: http://localhost:${PORT}/health`)
  console.log('━'.repeat(60))
})

// Initialize REST API fallback
const restFallback = new WhaleRestFallback()

// Initialize services
async function initializeServices() {
  try {
    console.log('\n📡 Initializing services...\n')

    // Start Whale Alert WebSocket
    console.log('1. Starting Whale Alert WebSocket (whale transactions)...')
    whaleAlertService.connect()

    // Wait a moment for connections
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Start REST API fallback (polls every 2 minutes)
    console.log('2. Starting REST API fallback (fills gaps from WebSocket)...')
    restFallback.start()

    // Start scheduler (alert monitoring and cleanup)
    console.log('3. Starting scheduled jobs (alert monitoring and cleanup)...')
    scheduler.start()

    console.log('\n✅ All services initialized successfully\n')
  } catch (error) {
    console.error('❌ Service initialization error:', error.message)
  }
}

// Initialize services after server starts
initializeServices()

// Graceful shutdown (async for proper cleanup)
async function gracefulShutdown(signal) {
  console.log(`\n\n${signal} received. Starting graceful shutdown...`)

  // Force shutdown after 15 seconds if graceful shutdown fails
  const forceTimeout = setTimeout(() => {
    console.error('⚠️  Graceful shutdown timeout (15s). Forcing exit...')
    process.exit(1)
  }, 15000)

  try {
    // 1. Disconnect WhaleAlert WebSocket FIRST (with await)
    console.log('1/4 Disconnecting WhaleAlert WebSocket...')
    await whaleAlertService.disconnect()
    console.log('✅ WhaleAlert WebSocket disconnected')

    // 2. Stop REST fallback
    console.log('2/4 Stopping REST fallback...')
    restFallback.stop()
    console.log('✅ REST fallback stopped')

    // 3. Stop scheduler
    console.log('3/4 Stopping scheduler...')
    scheduler.stop()
    console.log('✅ Scheduler stopped')

    // 4. Close HTTP server
    console.log('4/4 Closing HTTP server...')
    await new Promise((resolve) => {
      server.close(() => {
        console.log('✅ HTTP server closed')
        resolve()
      })
    })

    clearTimeout(forceTimeout)
    console.log('\n👋 SubMarine Backend shut down gracefully\n')
    process.exit(0)
  } catch (error) {
    clearTimeout(forceTimeout)
    console.error('❌ Error during graceful shutdown:', error.message)
    process.exit(1)
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
})

export default app
