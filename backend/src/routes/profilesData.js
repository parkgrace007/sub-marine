import express from 'express'
import rateLimit from 'express-rate-limit'
import supabase from '../utils/supabase.js'

const router = express.Router()

// Rate limiter for profiles API
const profilesApiLimiter = rateLimit({
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

/**
 * GET /api/profiles/:userId
 * Fetch a user's profile by ID
 */
router.get('/:userId', profilesApiLimiter, async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId'
      })
    }

    console.log(`👤 [ProfilesAPI] Fetching profile for user: ${userId.substring(0, 8)}...`)

    const startTime = Date.now()
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const duration = Date.now() - startTime

    if (queryError) {
      // PGRST116 = No rows returned (user doesn't have profile yet)
      if (queryError.code === 'PGRST116') {
        console.log(`   ℹ️ No profile found for user ${userId.substring(0, 8)}...`)
        return res.json({
          success: true,
          data: null,
          queryTime: duration,
          timestamp: Date.now()
        })
      }

      console.error('❌ [ProfilesAPI] Query error:', queryError)
      return res.status(500).json({
        success: false,
        error: queryError.message
      })
    }

    console.log(`   ✅ Profile fetched in ${duration}ms`)

    res.json({
      success: true,
      data: data,
      queryTime: duration,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('❌ [ProfilesAPI] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * PATCH /api/profiles/:userId
 * Update a user's profile (nickname, trading_balance, etc.)
 */
router.patch('/:userId', profilesApiLimiter, async (req, res) => {
  try {
    const { userId } = req.params
    const updateData = req.body

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId'
      })
    }

    // Validate updateData - only allow specific fields
    const allowedFields = [
      'nickname',
      'trading_balance',
      'total_trades',
      'winning_trades',
      'total_pnl',
      'all_time_high_balance',
      'max_drawdown',
      'last_trade_at',
      'updated_at'
    ]

    const filteredData = {}
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key]
      }
    }

    // Always set updated_at
    filteredData.updated_at = new Date().toISOString()

    console.log(`👤 [ProfilesAPI] Updating profile for user: ${userId.substring(0, 8)}...`)
    console.log(`   Fields: ${Object.keys(filteredData).join(', ')}`)

    const startTime = Date.now()
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(filteredData)
      .eq('id', userId)
      .select()
      .single()

    const duration = Date.now() - startTime

    if (updateError) {
      console.error('❌ [ProfilesAPI] Update error:', updateError)
      return res.status(500).json({
        success: false,
        error: updateError.message
      })
    }

    console.log(`   ✅ Profile updated in ${duration}ms`)

    res.json({
      success: true,
      data: data,
      queryTime: duration,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('❌ [ProfilesAPI] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/profiles/:userId
 * Create a new profile (used when user first signs up)
 */
router.post('/:userId', profilesApiLimiter, async (req, res) => {
  try {
    const { userId } = req.params
    const { nickname } = req.body

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId'
      })
    }

    console.log(`👤 [ProfilesAPI] Creating profile for user: ${userId.substring(0, 8)}...`)

    const startTime = Date.now()
    const { data, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        nickname: nickname || 'User',
        role: 'user',
        trading_balance: 10000, // Default starting balance
        total_trades: 0,
        winning_trades: 0,
        total_pnl: 0,
        all_time_high_balance: 10000,
        max_drawdown: 0
      })
      .select()
      .single()

    const duration = Date.now() - startTime

    if (insertError) {
      // Check if profile already exists
      if (insertError.code === '23505') {
        console.log(`   ℹ️ Profile already exists for user ${userId.substring(0, 8)}...`)
        // Fetch existing profile instead
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        return res.json({
          success: true,
          data: existingProfile,
          queryTime: duration,
          timestamp: Date.now()
        })
      }

      console.error('❌ [ProfilesAPI] Insert error:', insertError)
      return res.status(500).json({
        success: false,
        error: insertError.message
      })
    }

    console.log(`   ✅ Profile created in ${duration}ms`)

    res.json({
      success: true,
      data: data,
      queryTime: duration,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('❌ [ProfilesAPI] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/profiles/health
 * Health check for profiles API
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now()

    const { count, error } = await supabase
      .from('profiles')
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
      queryTime: duration
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
