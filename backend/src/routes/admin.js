/**
 * Admin API Routes
 * All routes require admin authentication
 */

import express from 'express'
import { supabase } from '../utils/supabase.js'
import { verifyToken, requireRole, logAdminAction, auditLog } from '../middleware/adminAuth.js'
import metricsCollector from '../services/metricsCollector.js'
import whaleAlertService from '../services/whaleAlert.js'
import { activeSessions } from './visitors.js'

const router = express.Router()

// Apply authentication to all admin routes
router.use(verifyToken)
router.use(requireRole(['admin', 'super_admin']))

// =====================================================
// SYSTEM MONITORING
// =====================================================

/**
 * GET /api/admin/system/metrics
 * Get system metrics (CPU, memory, uptime)
 */
router.get('/system/metrics', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 60

    const metrics = {
      current: metricsCollector.getCurrentSystemMetrics(),
      history: metricsCollector.getSystemMetrics(minutes),
      summary: metricsCollector.getSummary()
    }

    res.json(metrics)
  } catch (err) {
    console.error('❌ [Admin API] Error fetching system metrics:', err)
    res.status(500).json({ error: 'Failed to fetch system metrics', message: err.message })
  }
})

/**
 * GET /api/admin/system/services
 * Get all service statuses (WhaleAlert, Scheduler, etc.)
 */
router.get('/system/services', async (req, res) => {
  try {
    const services = {
      whaleAlert: whaleAlertService.getStatus ? whaleAlertService.getStatus() : {},
      metrics: metricsCollector.getAllServiceStatus(),
      timestamp: Date.now()
    }

    res.json(services)
  } catch (err) {
    console.error('❌ [Admin API] Error fetching services:', err)
    res.status(500).json({ error: 'Failed to fetch services', message: err.message })
  }
})

/**
 * GET /api/admin/system/database
 * Get database statistics (table sizes, row counts)
 */
router.get('/system/database', async (req, res) => {
  try {
    // Get row counts for all major tables
    const tables = [
      'whale_events',
      'market_sentiment',
      'alerts',
      'alert_history',
      'market_briefings',
      'translated_news',
      'profiles',
      'trading_history',
      'admin_audit_logs'
    ]

    const stats = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (!error) {
          stats[table] = { count }
        } else {
          stats[table] = { count: null, error: error.message }
        }
      } catch (err) {
        stats[table] = { count: null, error: err.message }
      }
    }

    // Add summary
    const totalRows = Object.values(stats)
      .filter(s => s.count !== null)
      .reduce((sum, s) => sum + s.count, 0)

    res.json({
      tables: stats,
      summary: {
        totalTables: tables.length,
        totalRows,
        timestamp: Date.now()
      }
    })
  } catch (err) {
    console.error('❌ [Admin API] Error fetching database stats:', err)
    res.status(500).json({ error: 'Failed to fetch database stats', message: err.message })
  }
})

/**
 * GET /api/admin/system/api-usage
 * Get API call statistics
 */
router.get('/system/api-usage', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 60

    const stats = {
      apiCalls: metricsCollector.getApiCallStats(minutes),
      aggregated: metricsCollector.getAggregatedStats(),
      activeVisitors: activeSessions.size,
      timestamp: Date.now()
    }

    res.json(stats)
  } catch (err) {
    console.error('❌ [Admin API] Error fetching API usage:', err)
    res.status(500).json({ error: 'Failed to fetch API usage', message: err.message })
  }
})

// =====================================================
// USER MANAGEMENT
// =====================================================

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const role = req.query.role  // Filter by role
    const search = req.query.search  // Search by nickname/email

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }

    if (search) {
      query = query.or(`nickname.ilike.%${search}%,id.in.(SELECT id FROM auth.users WHERE email ILIKE '%${search}%')`)
    }

    // Pagination
    const start = (page - 1) * limit
    query = query.range(start, start + limit - 1)

    const { data: users, error, count } = await query

    if (error) throw error

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (err) {
    console.error('❌ [Admin API] Error fetching users:', err)
    res.status(500).json({ error: 'Failed to fetch users', message: err.message })
  }
})

/**
 * GET /api/admin/users/:id
 * Get user details
 */
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // Get auth user
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId)

    if (authError) {
      console.warn('⚠️  Could not fetch auth user:', authError.message)
    }

    // Get trading stats
    const { data: tradingStats, error: tradingError } = await supabase
      .from('trading_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    res.json({
      profile,
      auth: user ? {
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      } : null,
      recentTrades: tradingStats || [],
      timestamp: Date.now()
    })
  } catch (err) {
    console.error('❌ [Admin API] Error fetching user:', err)
    res.status(500).json({ error: 'Failed to fetch user', message: err.message })
  }
})

/**
 * PATCH /api/admin/users/:id/role
 * Change user role
 */
router.patch('/users/:id/role',
  auditLog('ROLE_CHANGE', (req, body) => ({
    resourceType: 'user',
    resourceId: req.params.id,
    details: { newRole: req.body.role, oldRole: body.oldRole }
  })),
  async (req, res) => {
    try {
      const userId = req.params.id
      const { role } = req.body

      // Validate role
      const validRoles = ['user', 'moderator', 'admin', 'super_admin']
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          message: `Role must be one of: ${validRoles.join(', ')}`
        })
      }

      // Prevent self-demotion
      if (userId === req.user.id && req.user.role !== role) {
        return res.status(403).json({
          error: 'Cannot change own role',
          message: 'You cannot change your own role'
        })
      }

      // Get old role for audit
      const { data: oldProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      // Update role
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      res.json({
        success: true,
        user: data,
        oldRole: oldProfile?.role
      })
    } catch (err) {
      console.error('❌ [Admin API] Error updating role:', err)
      res.status(500).json({ error: 'Failed to update role', message: err.message })
    }
  }
)

// =====================================================
// DATA MANAGEMENT
// =====================================================

/**
 * GET /api/admin/data/whale-events/stats
 * Get whale events statistics
 */
router.get('/data/whale-events/stats', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    // Total count
    const { count: totalCount } = await supabase
      .from('whale_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cutoff)

    // By flow type
    const { data: byFlowType } = await supabase
      .from('whale_events')
      .select('flow_type')
      .gte('created_at', cutoff)

    const flowTypeStats = byFlowType?.reduce((acc, event) => {
      acc[event.flow_type] = (acc[event.flow_type] || 0) + 1
      return acc
    }, {})

    // By blockchain
    const { data: byBlockchain } = await supabase
      .from('whale_events')
      .select('blockchain')
      .gte('created_at', cutoff)

    const blockchainStats = byBlockchain?.reduce((acc, event) => {
      acc[event.blockchain] = (acc[event.blockchain] || 0) + 1
      return acc
    }, {})

    // Top symbols
    const { data: topSymbols } = await supabase
      .from('whale_events')
      .select('symbol, amount_usd')
      .gte('created_at', cutoff)
      .order('amount_usd', { ascending: false })
      .limit(10)

    res.json({
      total: totalCount,
      byFlowType: flowTypeStats,
      byBlockchain: blockchainStats,
      topTransactions: topSymbols,
      timeRange: `Last ${hours} hours`,
      timestamp: Date.now()
    })
  } catch (err) {
    console.error('❌ [Admin API] Error fetching whale stats:', err)
    res.status(500).json({ error: 'Failed to fetch whale stats', message: err.message })
  }
})

/**
 * GET /api/admin/data/alerts/stats
 * Get alerts statistics
 */
router.get('/data/alerts/stats', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    // Total count
    const { count: totalCount } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cutoff)

    // By tier
    const { data: byTier } = await supabase
      .from('alerts')
      .select('tier')
      .gte('created_at', cutoff)

    const tierStats = byTier?.reduce((acc, alert) => {
      acc[alert.tier] = (acc[alert.tier] || 0) + 1
      return acc
    }, {})

    // By signal type
    const { data: bySignal } = await supabase
      .from('alerts')
      .select('signal_type')
      .gte('created_at', cutoff)

    const signalStats = bySignal?.reduce((acc, alert) => {
      acc[alert.signal_type] = (acc[alert.signal_type] || 0) + 1
      return acc
    }, {})

    res.json({
      total: totalCount,
      byTier: tierStats,
      bySignalType: signalStats,
      timeRange: `Last ${hours} hours`,
      timestamp: Date.now()
    })
  } catch (err) {
    console.error('❌ [Admin API] Error fetching alert stats:', err)
    res.status(500).json({ error: 'Failed to fetch alert stats', message: err.message })
  }
})

// =====================================================
// SERVICE CONTROL
// =====================================================

/**
 * POST /api/admin/services/whale/reconnect
 * Manually reconnect WhaleAlert WebSocket
 */
router.post('/services/whale/reconnect',
  auditLog('WHALE_RECONNECT', () => ({
    resourceType: 'service',
    resourceId: 'whale-alert',
    details: { action: 'manual_reconnect' }
  })),
  async (req, res) => {
    try {
      if (whaleAlertService.reconnect) {
        whaleAlertService.reconnect()
        res.json({ success: true, message: 'WhaleAlert reconnection initiated' })
      } else {
        res.status(503).json({ error: 'WhaleAlert service not available' })
      }
    } catch (err) {
      console.error('❌ [Admin API] Error reconnecting WhaleAlert:', err)
      res.status(500).json({ error: 'Failed to reconnect', message: err.message })
    }
  }
)

/**
 * POST /api/admin/services/whale/reset-429
 * Reset 429 block status
 */
router.post('/services/whale/reset-429',
  auditLog('WHALE_RESET_429', () => ({
    resourceType: 'service',
    resourceId: 'whale-alert',
    details: { action: 'reset_429_block' }
  })),
  async (req, res) => {
    try {
      if (whaleAlertService.reset429) {
        whaleAlertService.reset429()
        res.json({ success: true, message: '429 block reset' })
      } else {
        res.status(503).json({ error: 'WhaleAlert service not available' })
      }
    } catch (err) {
      console.error('❌ [Admin API] Error resetting 429:', err)
      res.status(500).json({ error: 'Failed to reset 429', message: err.message })
    }
  }
)

// =====================================================
// LOGS & AUDIT
// =====================================================

/**
 * GET /api/admin/logs/audit
 * Get audit logs
 */
router.get('/logs/audit', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const action = req.query.action  // Filter by action type
    const adminId = req.query.admin_id  // Filter by admin

    let query = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (action) {
      query = query.eq('action', action)
    }

    if (adminId) {
      query = query.eq('admin_id', adminId)
    }

    const start = (page - 1) * limit
    query = query.range(start, start + limit - 1)

    const { data: logs, error, count } = await query

    if (error) throw error

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (err) {
    console.error('❌ [Admin API] Error fetching audit logs:', err)
    res.status(500).json({ error: 'Failed to fetch audit logs', message: err.message })
  }
})

/**
 * GET /api/admin/logs/errors
 * Get error logs
 */
router.get('/logs/errors', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 60

    const errors = metricsCollector.getErrors(minutes)
    const stats = metricsCollector.getErrorStats(minutes)

    res.json({
      errors,
      stats,
      timestamp: Date.now()
    })
  } catch (err) {
    console.error('❌ [Admin API] Error fetching error logs:', err)
    res.status(500).json({ error: 'Failed to fetch error logs', message: err.message })
  }
})

export default router
