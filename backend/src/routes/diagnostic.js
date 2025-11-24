import express from 'express'
import { supabase } from '../utils/supabase.js'

const router = express.Router()

/**
 * Database Connection Diagnostic Endpoint
 * Tests Supabase connection and returns detailed diagnostic information
 *
 * GET /api/diagnostic/test-db
 *
 * Returns:
 * - Database connection status
 * - Sample data from key tables
 * - Row counts
 * - Environment variable status
 * - Deployment info
 */
router.get('/test-db', async (req, res) => {
  const startTime = Date.now()
  const diagnosticResult = {
    timestamp: new Date().toISOString(),
    success: true,
    errors: [],
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      supabaseUrlPrefix: process.env.SUPABASE_URL?.substring(0, 30) || 'MISSING'
    },
    tables: {},
    performance: {}
  }

  try {
    // Test 1: whale_events table
    console.log('🔍 [Diagnostic] Testing whale_events table...')
    const whaleStart = Date.now()
    const { data: whaleData, error: whaleError, count: whaleCount } = await supabase
      .from('whale_events')
      .select('id, timestamp, symbol, amount_usd, flow_type', { count: 'exact', head: false })
      .order('timestamp', { ascending: false })
      .limit(3)

    diagnosticResult.tables.whale_events = {
      accessible: !whaleError,
      error: whaleError?.message || null,
      totalCount: whaleCount,
      sampleData: whaleData?.map(w => ({
        id: w.id,
        symbol: w.symbol,
        amount_usd: w.amount_usd,
        flow_type: w.flow_type,
        timestamp: w.timestamp
      })) || [],
      queryTime: Date.now() - whaleStart
    }

    if (whaleError) {
      diagnosticResult.errors.push({ table: 'whale_events', error: whaleError.message })
    }

    // Test 2: indicator_alerts table
    console.log('🔍 [Diagnostic] Testing indicator_alerts table...')
    const alertStart = Date.now()
    const { data: alertData, error: alertError, count: alertCount } = await supabase
      .from('indicator_alerts')
      .select('id, timestamp, symbol, tier, signal_type', { count: 'exact', head: false })
      .order('timestamp', { ascending: false })
      .limit(3)

    diagnosticResult.tables.indicator_alerts = {
      accessible: !alertError,
      error: alertError?.message || null,
      totalCount: alertCount,
      sampleData: alertData?.map(a => ({
        id: a.id,
        symbol: a.symbol,
        tier: a.tier,
        signal_type: a.signal_type,
        timestamp: a.timestamp
      })) || [],
      queryTime: Date.now() - alertStart
    }

    if (alertError) {
      diagnosticResult.errors.push({ table: 'indicator_alerts', error: alertError.message })
    }

    // Test 3: market_sentiment table
    console.log('🔍 [Diagnostic] Testing market_sentiment table...')
    const sentimentStart = Date.now()
    const { data: sentimentData, error: sentimentError, count: sentimentCount } = await supabase
      .from('market_sentiment')
      .select('timestamp, swsi_score, bull_ratio, bear_ratio', { count: 'exact', head: false })
      .order('timestamp', { ascending: false })
      .limit(3)

    diagnosticResult.tables.market_sentiment = {
      accessible: !sentimentError,
      error: sentimentError?.message || null,
      totalCount: sentimentCount,
      sampleData: sentimentData || [],
      queryTime: Date.now() - sentimentStart
    }

    if (sentimentError) {
      diagnosticResult.errors.push({ table: 'market_sentiment', error: sentimentError.message })
    }

    // Test 4: Check for recent data (last 24 hours)
    console.log('🔍 [Diagnostic] Checking recent data...')
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { count: recentWhaleCount } = await supabase
      .from('whale_events')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', oneDayAgo)

    const { count: recentAlertCount } = await supabase
      .from('indicator_alerts')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', oneDayAgo)

    diagnosticResult.recentData = {
      last24Hours: {
        whaleEvents: recentWhaleCount || 0,
        indicatorAlerts: recentAlertCount || 0
      },
      dataFreshness: {
        whaleEvents: recentWhaleCount > 0 ? 'FRESH' : 'STALE',
        indicatorAlerts: recentAlertCount > 0 ? 'FRESH' : 'STALE'
      }
    }

    // Performance metrics
    diagnosticResult.performance.totalQueryTime = Date.now() - startTime
    diagnosticResult.performance.averageQueryTime =
      (diagnosticResult.tables.whale_events.queryTime +
       diagnosticResult.tables.indicator_alerts.queryTime +
       diagnosticResult.tables.market_sentiment.queryTime) / 3

    // Overall success determination
    diagnosticResult.success = diagnosticResult.errors.length === 0

    // Status code based on results
    const statusCode = diagnosticResult.success ? 200 : 500

    console.log('✅ [Diagnostic] Test completed:', {
      success: diagnosticResult.success,
      errorCount: diagnosticResult.errors.length,
      totalTime: diagnosticResult.performance.totalQueryTime + 'ms'
    })

    res.status(statusCode).json(diagnosticResult)

  } catch (err) {
    console.error('❌ [Diagnostic] Unexpected error:', err)
    res.status(500).json({
      timestamp: new Date().toISOString(),
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      environment: diagnosticResult.environment
    })
  }
})

/**
 * Health Check Endpoint
 * Simple health check for monitoring systems
 *
 * GET /api/diagnostic/health
 */
router.get('/health', async (req, res) => {
  try {
    // Quick DB ping
    const { error } = await supabase
      .from('whale_events')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    if (error) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message
      })
    }

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message
    })
  }
})

/**
 * Environment Check Endpoint
 * Checks if all required environment variables are set
 *
 * GET /api/diagnostic/env
 */
router.get('/env', (req, res) => {
  const requiredVars = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    WHALE_ALERT_API_KEY: !!process.env.WHALE_ALERT_API_KEY,
    NODE_ENV: !!process.env.NODE_ENV,
    PORT: !!process.env.PORT
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([_, exists]) => !exists)
    .map(([name]) => name)

  const allPresent = missingVars.length === 0

  res.json({
    status: allPresent ? 'ok' : 'missing_variables',
    variables: requiredVars,
    missing: missingVars,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
})

export default router
