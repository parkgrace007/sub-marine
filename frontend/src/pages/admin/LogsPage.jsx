import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

// API URL from environment variable or fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * LogsPage - Logs viewer admin page
 * - View audit logs (admin actions)
 * - View error logs (system errors)
 * - Filter and pagination
 */
export default function LogsPage() {
  const [tab, setTab] = useState('audit') // 'audit' or 'errors'
  const [auditLogs, setAuditLogs] = useState([])
  const [errorLogs, setErrorLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (tab === 'audit') {
      fetchAuditLogs()
    } else {
      fetchErrorLogs()
    }
  }, [tab, page])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })

      const res = await fetch(`${API_URL}/api/admin/logs/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to fetch audit logs')

      const data = await res.json()
      setAuditLogs(data.logs || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setLoading(false)
      setError(null)
    } catch (err) {
      console.error('Audit logs fetch error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const fetchErrorLogs = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token

      const res = await fetch(`${API_URL}/api/admin/logs/errors?minutes=1440`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to fetch error logs')

      const data = await res.json()
      setErrorLogs(data.errors || [])
      setLoading(false)
      setError(null)
    } catch (err) {
      console.error('Error logs fetch error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const actionColors = {
    ROLE_CHANGE: 'text-yellow-400',
    WHALE_RECONNECT: 'text-blue-400',
    WHALE_RESET_429: 'text-purple-400',
    USER_BAN: 'text-red-400',
    default: 'text-surface-300'
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Logs</h1>
          <button
            onClick={() => tab === 'audit' ? fetchAuditLogs() : fetchErrorLogs()}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-surface-300">
          <button
            onClick={() => { setTab('audit'); setPage(1); }}
            className={`px-6 py-3 font-medium transition-colors ${
              tab === 'audit'
                ? 'text-white border-b-2 border-primary'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => { setTab('errors'); setPage(1); }}
            className={`px-6 py-3 font-medium transition-colors ${
              tab === 'errors'
                ? 'text-white border-b-2 border-primary'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Error Logs
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-surface-400">Loading logs...</div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {tab === 'audit' ? (
              // Audit Logs
              <>
                {auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-surface-400">No audit logs found</div>
                ) : (
                  <div className="bg-surface-200 border border-surface-300 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-surface-300 border-b border-surface-400">
                          <tr>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-surface-400">Time</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-surface-400">Admin</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-surface-400">Action</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-surface-400">Resource</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-surface-400">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-300">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-surface-300/50 transition-colors">
                              <td className="px-6 py-4 text-sm text-surface-400 whitespace-nowrap">
                                {formatTimestamp(log.created_at)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-white">{log.admin_email}</div>
                                <div className="text-xs text-surface-400">{log.admin_id?.slice(0, 8)}...</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`font-mono text-sm ${actionColors[log.action] || actionColors.default}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-surface-300">
                                {log.resource_type && (
                                  <div>
                                    <span className="text-surface-400">{log.resource_type}:</span> {log.resource_id}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-surface-400">
                                {log.details && (
                                  <pre className="text-xs overflow-auto max-w-md">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-surface-300 border-t border-surface-400 px-6 py-3 flex items-center justify-between">
                      <div className="text-sm text-surface-400">
                        Page {page} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="bg-surface-100 hover:bg-surface-200 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="bg-surface-100 hover:bg-surface-200 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Error Logs
              <>
                {errorLogs.length === 0 ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-green-400 text-center">
                    No errors in the last 24 hours!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errorLogs.map((log, index) => (
                      <div
                        key={index}
                        className="bg-surface-200 border border-red-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-mono text-red-400 text-sm">{log.name || 'Error'}</div>
                          <div className="text-xs text-surface-400">
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </div>
                        <div className="text-white mb-2">{log.message}</div>
                        {log.stack && (
                          <details className="text-xs text-surface-400">
                            <summary className="cursor-pointer hover:text-white transition-colors">
                              Stack Trace
                            </summary>
                            <pre className="mt-2 p-3 bg-surface-100 rounded overflow-x-auto">
                              {log.stack}
                            </pre>
                          </details>
                        )}
                        {log.context && Object.keys(log.context).length > 0 && (
                          <div className="mt-2 text-xs text-surface-400">
                            <div>Context:</div>
                            <pre className="mt-1 p-2 bg-surface-100 rounded overflow-x-auto">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
