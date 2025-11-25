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

  const fetchDashboardData = async (isRetry = false) => {
    try {
      // 토큰 갱신 시도 (만료된 경우 자동 갱신)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        // 세션 에러 시 토큰 갱신 시도
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !refreshData.session) {
          console.error('Session refresh failed:', refreshError)
          setError('세션이 만료되었습니다. 다시 로그인해주세요.')
          setLoading(false)
          return
        }
      }

      // 최신 세션 다시 가져오기
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) return

      const token = currentSession.access_token

      // Fetch all dashboard data in parallel with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15초 타임아웃

      const fetchOptions = {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      }

      const [metricsRes, apiRes, dbRes, servicesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/system/metrics`, fetchOptions),
        fetch(`${API_URL}/api/admin/system/api-usage`, fetchOptions),
        fetch(`${API_URL}/api/admin/system/database`, fetchOptions),
        fetch(`${API_URL}/api/admin/system/services`, fetchOptions)
      ])

      clearTimeout(timeoutId)

      // 401 에러면 토큰 갱신 후 재시도
      if (metricsRes.status === 401 || apiRes.status === 401 || dbRes.status === 401 || servicesRes.status === 401) {
        if (!isRetry) {
          console.log('Token expired, refreshing...')
          await supabase.auth.refreshSession()
          return fetchDashboardData(true) // 한 번만 재시도
        }
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.')
      }

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

      // 네트워크 에러나 타임아웃은 자동 재시도
      if (err.name === 'AbortError' || err.message === 'Failed to fetch') {
        if (!isRetry) {
          console.log('Network error, retrying in 3 seconds...')
          setTimeout(() => fetchDashboardData(true), 3000)
          return
        }
      }

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
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
          <h3 className="font-semibold mb-2 text-yellow-400">대시보드 연결 오류</h3>
          <p className="text-surface-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchDashboardData(); }}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded transition-colors"
          >
            다시 시도
          </button>
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
