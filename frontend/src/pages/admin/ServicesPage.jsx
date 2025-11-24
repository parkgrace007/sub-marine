import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

// API URL from environment variable or fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * ServicesPage - Service control admin page
 * - View service statuses
 * - Manual reconnection controls
 * - Service restart/reset functions
 */
export default function ServicesPage() {
  const [services, setServices] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchServices()

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchServices, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token

      const res = await fetch(`${API_URL}/api/admin/system/services`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to fetch services')

      const data = await res.json()
      setServices(data)
      setLoading(false)
      setError(null)
    } catch (err) {
      console.error('Services fetch error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleWhaleReconnect = async () => {
    if (!confirm('Reconnect WhaleAlert WebSocket?')) return

    try {
      setActionLoading('whale_reconnect')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token

      const res = await fetch(`${API_URL}/api/admin/services/whale/reconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to reconnect')
      }

      const result = await res.json()
      alert(result.message || 'Reconnection initiated')
      await fetchServices()
    } catch (err) {
      console.error('Reconnect error:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReset429 = async () => {
    if (!confirm('Reset 429 (Rate Limit) block status?')) return

    try {
      setActionLoading('reset_429')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token

      const res = await fetch(`${API_URL}/api/admin/services/whale/reset-429`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to reset 429')
      }

      const result = await res.json()
      alert(result.message || '429 block reset')
      await fetchServices()
    } catch (err) {
      console.error('Reset 429 error:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  if (loading && !services) {
    return (
      <AdminLayout>
        <div className="text-white text-center py-12">Loading services...</div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
          <h3 className="font-semibold mb-2">Error loading services</h3>
          <p>{error}</p>
        </div>
      </AdminLayout>
    )
  }

  const whaleAlert = services?.whaleAlert || {}
  const metricsServices = services?.metrics || {}

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Services Control</h1>
          <button
            onClick={fetchServices}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* WhaleAlert Service */}
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐋</span>
              <div>
                <h2 className="text-xl font-semibold text-white">WhaleAlert WebSocket</h2>
                <p className="text-sm text-surface-400">Real-time whale transaction monitoring</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded font-semibold ${
              whaleAlert.connected
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {whaleAlert.connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          {/* Status Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-surface-100 rounded p-4">
              <div className="text-xs text-surface-400 mb-1">Events Received</div>
              <div className="text-2xl font-bold text-white">
                {whaleAlert.eventsReceived || 0}
              </div>
            </div>
            <div className="bg-surface-100 rounded p-4">
              <div className="text-xs text-surface-400 mb-1">Reconnects</div>
              <div className="text-2xl font-bold text-white">
                {whaleAlert.reconnectCount || 0}
              </div>
            </div>
            <div className="bg-surface-100 rounded p-4">
              <div className="text-xs text-surface-400 mb-1">Last Event</div>
              <div className="text-sm font-medium text-white">
                {formatTimestamp(whaleAlert.lastEventTime)}
              </div>
            </div>
          </div>

          {/* Connection Info */}
          {whaleAlert.connected && (
            <div className="bg-surface-100 rounded p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-400">Connection State:</span>
                <span className="text-green-400 font-medium">{whaleAlert.state || 'OPEN'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Connected At:</span>
                <span className="text-white">{formatTimestamp(whaleAlert.connectedAt)}</span>
              </div>
              {whaleAlert.blocked429 && (
                <div className="flex justify-between">
                  <span className="text-surface-400">Rate Limit (429):</span>
                  <span className="text-red-400 font-medium">BLOCKED</span>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={handleWhaleReconnect}
              disabled={actionLoading === 'whale_reconnect'}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'whale_reconnect' ? 'Reconnecting...' : 'Reconnect WebSocket'}
            </button>
            <button
              onClick={handleReset429}
              disabled={actionLoading === 'reset_429'}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'reset_429' ? 'Resetting...' : 'Reset 429 Block'}
            </button>
          </div>
        </div>

        {/* Other Services */}
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Services</h2>
          <div className="space-y-3">
            {/* Metrics Collector */}
            <div className="flex items-center justify-between bg-surface-100 rounded p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-medium text-white">Metrics Collector</div>
                  <div className="text-xs text-surface-400">System performance monitoring</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-surface-400">
                  {metricsServices.metricsCount || 0} metrics collected
                </span>
                <div className="w-3 h-3 rounded-full bg-green-500" title="Active" />
              </div>
            </div>

            {/* Database */}
            <div className="flex items-center justify-between bg-surface-100 rounded p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💾</span>
                <div>
                  <div className="font-medium text-white">Supabase Database</div>
                  <div className="text-xs text-surface-400">PostgreSQL + Realtime</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-surface-400">Connected</span>
                <div className="w-3 h-3 rounded-full bg-green-500" title="Connected" />
              </div>
            </div>

            {/* API Server */}
            <div className="flex items-center justify-between bg-surface-100 rounded p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <div className="font-medium text-white">Express API Server</div>
                  <div className="text-xs text-surface-400">Backend REST API</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-surface-400">Port 3000</span>
                <div className="w-3 h-3 rounded-full bg-green-500" title="Running" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="text-sm text-blue-400">
              <div className="font-semibold mb-2">Service Control Guidelines</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Use "Reconnect WebSocket" if whale events stop coming in</li>
                <li>Use "Reset 429 Block" if rate limited by Whale Alert API</li>
                <li>All service actions are logged in Audit Logs</li>
                <li>Services auto-reconnect on errors (up to 5 retries)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
