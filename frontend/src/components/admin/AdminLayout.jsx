import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../utils/supabase'

/**
 * AdminLayout - Main layout for admin pages
 * - Sidebar navigation
 * - Top header with user info
 * - Protected route wrapper (admin role required)
 */
export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        navigate('/admin/login')
        return
      }

      // Get profile with role
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error || !profileData) {
        navigate('/admin/login')
        return
      }

      // Check admin role
      if (profileData.role !== 'admin' && profileData.role !== 'super_admin') {
        await supabase.auth.signOut()
        navigate('/admin/login')
        return
      }

      setUser(session.user)
      setProfile(profileData)
      setLoading(false)
    } catch (err) {
      console.error('Auth check error:', err)
      navigate('/admin/login')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/logs', label: 'Logs', icon: '📝' },
    { path: '/admin/services', label: 'Services', icon: '⚙️' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-surface-200 border-r border-surface-300 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-300">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold text-white">SubMarine Admin</h1>
          ) : (
            <span className="text-2xl">🐋</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-surface-400 hover:text-white p-2 rounded hover:bg-surface-300 transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-surface-400 hover:text-white hover:bg-surface-300'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-surface-300">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="text-surface-400 text-sm">
                <div className="font-medium text-white">{profile?.nickname || 'Admin'}</div>
                <div className="text-xs">{user?.email}</div>
                <div className="text-xs text-primary capitalize">{profile?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-surface-300 hover:bg-surface-400 text-white py-2 rounded transition-colors text-sm"
              >
                Sign Out
              </button>
              <Link
                to="/"
                className="block w-full text-center bg-surface-300 hover:bg-surface-400 text-white py-2 rounded transition-colors text-sm"
              >
                ← Main Site
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="text-surface-400 hover:text-white p-2 rounded hover:bg-surface-300 transition-colors text-xl"
                title="Sign Out"
              >
                🚪
              </button>
              <Link
                to="/"
                className="text-surface-400 hover:text-white p-2 rounded hover:bg-surface-300 transition-colors text-xl"
                title="Main Site"
              >
                🏠
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-surface-200 border-b border-surface-300 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">
              {navItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
            </h2>
          </div>

          <div className="flex items-center gap-6 text-sm text-surface-400">
            <div className="flex items-center gap-2">
              <span>v1.0</span>
              <span className="w-2 h-2 bg-green-500 rounded-full" title="System Online"></span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
