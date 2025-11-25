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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    return () => {
      clearInterval(interval)
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

          {/* Active Visitors - 헤더에도 표시되지만 대시보드에서도 확인 가능 */}
          <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
            <div className="text-surface-400 text-sm mb-1">Active Visitors</div>
            <div className="text-2xl font-bold text-green-400">
              {apiStats?.activeVisitors ?? '-'}
            </div>
            <div className="text-xs text-green-400 mt-1">● 실시간</div>
          </div>
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

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={fetchDashboardData}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded transition-colors"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
