import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

// API URL from environment variable or fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * DashboardPage - Admin dashboard main page
 * - System metrics (CPU, memory, uptime)
 * - API usage statistics
 * - Database statistics
 * - Service status overview
 */
export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [apiStats, setApiStats] = useState(null)
  const [dbStats, setDbStats] = useState(null)
  const [services, setServices] = useState(null)
  const [activeUserCount, setActiveUserCount] = useState(0)
  const [recentVisitors, setRecentVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
    // TEMPORARILY DISABLED: Activity tracking causing production issues
    // fetchActiveUsers()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
      // fetchActiveUsers()
    }, 30000)

    // TEMPORARILY DISABLED: Realtime subscription to user_activity_logs
    // const channel = supabase
    //   .channel('activity_changes')
    //   .on('postgres_changes', {
    //     event: '*',
    //     schema: 'public',
    //     table: 'user_activity_logs'
    //   }, () => {
    //     fetchActiveUsers()
    //   })
    //   .subscribe()

    return () => {
      clearInterval(interval)
      // supabase.removeChannel(channel)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token

      // Fetch all dashboard data in parallel
      const [metricsRes, apiRes, dbRes, servicesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/system/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/system/api-usage`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/system/database`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/system/services`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!metricsRes.ok || !apiRes.ok || !dbRes.ok || !servicesRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const [metricsData, apiData, dbData, servicesData] = await Promise.all([
        metricsRes.json(),
        apiRes.json(),
        dbRes.json(),
        servicesRes.json()
      ])

      setMetrics(metricsData)
      setApiStats(apiData)
      setDbStats(dbData)
      setServices(servicesData)
      setLoading(false)
      setError(null)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const fetchActiveUsers = async () => {
    try {
      // Fetch active user count (last 5 minutes)
      const { count, error: countError } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .gt('last_activity_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

      if (countError) throw countError
      setActiveUserCount(count || 0)

      // Fetch recent visitors (last 20)
      const { data: visitors, error: visitorsError } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('last_activity_at', { ascending: false })
        .limit(20)

      if (visitorsError) throw visitorsError
      setRecentVisitors(visitors || [])
    } catch (err) {
      console.error('Failed to fetch active users:', err)
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatUptime = (seconds) => {
    if (!seconds) return '0s'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${mins}m`
  }

  const formatRelativeTime = (timestamp) => {
    const now = Date.now()
    const then = new Date(timestamp).getTime()
    const diffMs = now - then
    const diffSecs = Math.floor(diffMs / 1000)

    if (diffSecs < 60) return `${diffSecs}초 전`
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}분 전`
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}시간 전`
    return `${Math.floor(diffSecs / 86400)}일 전`
  }

  const isUserActive = (timestamp) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return new Date(timestamp).getTime() > fiveMinutesAgo
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-white text-center py-12">Loading dashboard...</div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
          <h3 className="font-semibold mb-2">Error loading dashboard</h3>
          <p>{error}</p>
        </div>
      </AdminLayout>
    )
  }

  const current = metrics?.current || {}
  const summary = metrics?.summary || {}

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Uptime */}
          <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
            <div className="text-surface-400 text-sm mb-1">Server Uptime</div>
            <div className="text-2xl font-bold text-white">{formatUptime(current.uptime)}</div>
            <div className="text-xs text-green-400 mt-1">● Online</div>
          </div>

          {/* Memory Usage */}
          <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
            <div className="text-surface-400 text-sm mb-1">Memory Usage</div>
            <div className="text-2xl font-bold text-white">
              {current.memory?.usagePercent?.toFixed(1)}%
            </div>
            <div className="text-xs text-surface-400 mt-1">
              {formatBytes(current.memory?.used)} / {formatBytes(current.memory?.total)}
            </div>
          </div>

          {/* CPU Usage */}
          <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
            <div className="text-surface-400 text-sm mb-1">CPU Usage</div>
            <div className="text-2xl font-bold text-white">
              {current.cpu?.usage?.toFixed(1)}%
            </div>
            <div className="text-xs text-surface-400 mt-1">
              {current.cpu?.cores} cores
            </div>
          </div>

          {/* API Calls (Last Hour) */}
          <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
            <div className="text-surface-400 text-sm mb-1">API Calls (1h)</div>
            <div className="text-2xl font-bold text-white">
              {apiStats?.apiCalls?.lastHour || 0}
            </div>
            <div className="text-xs text-surface-400 mt-1">
              {apiStats?.apiCalls?.avgResponseTime?.toFixed(0)}ms avg
            </div>
          </div>

          {/* TEMPORARILY DISABLED: Active Users card
          <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
            <div className="text-surface-400 text-sm mb-1">Active Users</div>
            <div className="text-2xl font-bold text-white">
              {activeUserCount}
            </div>
            <div className="text-xs text-green-400 mt-1">● Last 5 minutes</div>
          </div>
          */}
        </div>

        {/* System Metrics Chart */}
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Memory Chart */}
            <div>
              <div className="text-sm text-surface-400 mb-2">Memory History</div>
              <div className="h-48 bg-surface-100 rounded flex items-end gap-1 p-2">
                {metrics?.history?.slice(-20).map((m, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary rounded-t transition-all"
                    style={{ height: `${m.memory?.usagePercent || 0}%` }}
                    title={`${m.memory?.usagePercent?.toFixed(1)}%`}
                  />
                ))}
              </div>
            </div>

            {/* CPU Chart */}
            <div>
              <div className="text-sm text-surface-400 mb-2">CPU History</div>
              <div className="h-48 bg-surface-100 rounded flex items-end gap-1 p-2">
                {metrics?.history?.slice(-20).map((m, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-green-500 rounded-t transition-all"
                    style={{ height: `${m.cpu?.usage || 0}%` }}
                    title={`${m.cpu?.usage?.toFixed(1)}%`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Database Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dbStats?.tables && Object.entries(dbStats.tables).map(([table, stats]) => (
              <div key={table} className="bg-surface-100 rounded p-4">
                <div className="text-xs text-surface-400 mb-1">{table}</div>
                <div className="text-lg font-semibold text-white">
                  {stats.count !== null ? stats.count.toLocaleString() : 'N/A'}
                </div>
                {stats.error && (
                  <div className="text-xs text-red-400 mt-1">Error</div>
                )}
              </div>
            ))}
          </div>
          {dbStats?.summary && (
            <div className="mt-4 text-sm text-surface-400">
              Total: {dbStats.summary.totalRows?.toLocaleString()} rows across {dbStats.summary.totalTables} tables
            </div>
          )}
        </div>

        {/* Services Status */}
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Services Status</h2>
          <div className="space-y-3">
            {/* WhaleAlert Service */}
            <div className="flex items-center justify-between bg-surface-100 rounded p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🐋</span>
                <div>
                  <div className="font-medium text-white">WhaleAlert WebSocket</div>
                  <div className="text-xs text-surface-400">
                    {services?.whaleAlert?.connected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                services?.whaleAlert?.connected ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>

            {/* Metrics Collector */}
            <div className="flex items-center justify-between bg-surface-100 rounded p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-medium text-white">Metrics Collector</div>
                  <div className="text-xs text-surface-400">Active</div>
                </div>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          </div>
        </div>

        {/* TEMPORARILY DISABLED: Recent Visitors section
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Visitors ({recentVisitors.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentVisitors.length === 0 ? (
              <div className="text-surface-400 text-center py-8">No recent visitors</div>
            ) : (
              recentVisitors.map((visitor) => {
                const active = isUserActive(visitor.last_activity_at)
                return (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between bg-surface-100 rounded p-4 hover:bg-surface-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-surface-400'}`} />
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {visitor.nickname || 'Anonymous'}
                          {visitor.is_authenticated && (
                            <span className="ml-2 text-xs text-primary">● Authenticated</span>
                          )}
                        </div>
                        <div className="text-xs text-surface-400">
                          {visitor.current_page || '/'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-surface-400">
                        {formatRelativeTime(visitor.last_activity_at)}
                      </div>
                      {active && (
                        <div className="text-xs text-green-400 mt-1">Online</div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
        */}

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={() => {
              fetchDashboardData()
              // fetchActiveUsers()
            }}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded transition-colors"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
