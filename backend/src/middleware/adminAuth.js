/**
 * Admin Authentication & Authorization Middleware
 * Verifies Supabase JWT and checks user role
 */

import { supabase } from '../utils/supabase.js'

/**
 * Verify Supabase JWT token from Authorization header
 * Attaches user object to req.user if valid
 */
async function verifyToken(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid Authorization header',
        message: 'Please provide a valid JWT token'
      })
    }

    const token = authHeader.split(' ')[1]

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.log('❌ [Admin Auth] Token verification failed:', error?.message)
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: 'Please log in again'
      })
    }

    // Fetch user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nickname, role, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('❌ [Admin Auth] Profile not found for user:', user.id)
      return res.status(403).json({
        error: 'Profile not found',
        message: 'User profile is missing'
      })
    }

    // Attach user and profile to request
    req.user = {
      id: user.id,
      email: user.email,
      ...profile
    }

    next()
  } catch (err) {
    console.error('❌ [Admin Auth] Error:', err)
    return res.status(500).json({
      error: 'Authentication error',
      message: err.message
    })
  }
}

/**
 * Require specific role(s) to access endpoint
 * Usage: requireRole(['admin', 'super_admin'])
 */
function requireRole(allowedRoles = []) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    const userRole = req.user.role || 'user'

    // Check if user has required role
    if (!allowedRoles.includes(userRole)) {
      console.log(`⚠️  [Admin Auth] Access denied for ${req.user.email} (role: ${userRole})`)

      return res.status(403).json({
        error: 'Forbidden',
        message: `Requires one of: ${allowedRoles.join(', ')}`,
        yourRole: userRole
      })
    }

    console.log(`✅ [Admin Auth] ${req.user.email} (${userRole}) accessed ${req.method} ${req.path}`)
    next()
  }
}

/**
 * Log admin action to audit trail
 * Automatically logs action with details
 */
async function logAdminAction(req, action, resourceType, resourceId, details = {}) {
  try {
    if (!req.user) {
      console.warn('⚠️  [Audit] Cannot log action without authenticated user')
      return
    }

    const { error } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: req.user.id,
        admin_email: req.user.email,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
      })

    if (error) {
      console.error('❌ [Audit] Failed to log action:', error.message)
    } else {
      console.log(`📝 [Audit] ${req.user.email} -> ${action} (${resourceType}:${resourceId})`)
    }
  } catch (err) {
    console.error('❌ [Audit] Error:', err.message)
  }
}

/**
 * Middleware to automatically log all admin actions
 * Use this on routes that modify data
 */
function auditLog(action, getResourceDetails) {
  return async (req, res, next) => {
    // Capture original res.json to log after response
    const originalJson = res.json.bind(res)

    res.json = function (body) {
      // Only log if action was successful (status < 400)
      if (res.statusCode < 400) {
        const { resourceType, resourceId, details } = getResourceDetails(req, body)

        logAdminAction(req, action, resourceType, resourceId, details)
          .catch(err => console.error('❌ [Audit] Async log error:', err))
      }

      return originalJson(body)
    }

    next()
  }
}

export {
  verifyToken,
  requireRole,
  logAdminAction,
  auditLog
}
