import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../utils/supabase'

/**
 * AdminLoginPage - Admin authentication page
 * - Email/password login with Supabase
 * - Role verification (admin/super_admin only)
 * - Session management with JWT tokens
 */
export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check if already logged in as admin
  useEffect(() => {
    checkAdminSession()
  }, [])

  const checkAdminSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Check if user has admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
          // Already logged in as admin, redirect to dashboard
          navigate('/admin/dashboard')
        }
      }
    } catch (err) {
      console.error('Session check error:', err)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Timeout handler
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setError('Login timeout - Please check your connection and try again')
    }, 15000) // 15 second timeout

    try {
      console.log('🔐 Attempting login for:', email)

      // 1. Sign in with Supabase
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        console.error('❌ Sign in error:', signInError)
        throw signInError
      }

      if (!session) {
        throw new Error('No session returned from login')
      }

      console.log('✅ Sign in successful, checking role...')

      // 2. Verify user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, nickname')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError)
        throw profileError
      }

      console.log('📋 Profile fetched:', { nickname: profile.nickname, role: profile.role })

      // 3. Check role
      if (profile.role !== 'admin' && profile.role !== 'super_admin') {
        // Not an admin - sign out immediately
        await supabase.auth.signOut()
        throw new Error('Access denied: Admin role required')
      }

      // 4. Success - clear timeout and navigate to dashboard
      clearTimeout(timeoutId)
      console.log('✅ Admin login successful:', profile.nickname)
      navigate('/admin/dashboard')

    } catch (err) {
      clearTimeout(timeoutId)
      console.error('❌ Login error:', err)
      setError(err.message || 'Login failed - please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SubMarine Admin</h1>
          <p className="text-surface-400">System Administration Panel</p>
        </div>

        {/* Login Form */}
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-400 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-100 border border-surface-300 rounded px-4 py-2 text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="admin@submarine.com"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-400 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface-100 border border-surface-300 rounded px-4 py-2 text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-surface-300">
            <p className="text-xs text-surface-500 text-center">
              Admin access only. All actions are logged and monitored.
            </p>
          </div>
        </div>

        {/* Back to Main Site */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-surface-400 hover:text-white text-sm transition-colors"
          >
            ← Back to Main Site
          </button>
        </div>
      </div>
    </div>
  )
}
