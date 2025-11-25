/**
 * VisitorWidget - Admin Dashboard 실시간 접속자 위젯
 * - 현재 접속자 수
 * - 접속자 목록 (페이지별)
 * - 최근 방문자 통계
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Users, Activity, Eye, Clock, MapPin, RefreshCw } from 'lucide-react'
import { supabase } from '../../utils/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function VisitorWidget() {
  const [realtime, setRealtime] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentVisitors, setRecentVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch with timeout (Render cold start can take 30+ seconds)
  const fetchWithTimeout = async (url, options, timeout = 30000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  const fetchVisitorData = useCallback(async (isRetry = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session.access_token
      const headers = { Authorization: `Bearer ${token}` }

      // Fetch all visitor data in parallel with timeout
      const [realtimeRes, statsRes, recentRes] = await Promise.all([
        fetchWithTimeout(`${API_URL}/api/visitors/admin/realtime`, { headers }),
        fetchWithTimeout(`${API_URL}/api/visitors/admin/stats?days=7`, { headers }),
        fetchWithTimeout(`${API_URL}/api/visitors/admin/recent?limit=10`, { headers })
      ])

      if (!realtimeRes.ok || !statsRes.ok || !recentRes.ok) {
        throw new Error('Failed to fetch visitor data')
      }

      const [realtimeData, statsData, recentData] = await Promise.all([
        realtimeRes.json(),
        statsRes.json(),
        recentRes.json()
      ])

      setRealtime(realtimeData)
      setStats(statsData)
      setRecentVisitors(recentData.visitors || [])
      setLastUpdate(new Date())
      setLoading(false)
      setError(null)
      setRetryCount(0)
    } catch (err) {
      console.error('Visitor data fetch error:', err)

      // Auto retry up to 3 times with increasing delay
      if (!isRetry && retryCount < 3) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => fetchVisitorData(true), 3000 * (retryCount + 1))
        return
      }

      setError(err.message)
      setLoading(false)
    }
  }, [retryCount])

  useEffect(() => {
    fetchVisitorData()

    // Auto-refresh every 10 seconds for realtime data
    const interval = setInterval(fetchVisitorData, 10000)

    return () => clearInterval(interval)
  }, [fetchVisitorData])

  const formatTime = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getPageName = (path) => {
    const pageNames = {
      '/': '메인',
      '/whale-alerts': '고래알림',
      '/trading': '트레이딩',
      '/events': '이벤트',
      '/news': '뉴스',
      '/guide': '가이드'
    }
    return pageNames[path] || path
  }

  if (loading) {
    return (
      <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
        <div className="text-surface-400 text-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p>방문자 데이터 로딩 중...</p>
          {retryCount > 0 && (
            <p className="text-xs text-yellow-500 mt-2">
              서버 응답 대기 중... (재시도 {retryCount}/3)
            </p>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
        <div className="text-center py-8">
          <p className="text-yellow-400 mb-2">방문자 데이터 일시적 연결 실패</p>
          <p className="text-xs text-surface-400 mb-4">
            서버가 절전 모드에서 깨어나는 중일 수 있습니다 (최대 30초)
          </p>
          <button
            onClick={() => { setRetryCount(0); setLoading(true); fetchVisitorData(); }}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded text-sm transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  const activeCount = realtime?.count || 0
  const activeSessions = realtime?.sessions || []

  return (
    <div className="space-y-6">
      {/* 실시간 접속자 헤더 */}
      <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            실시간 접속자
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-surface-400">
              마지막 업데이트: {lastUpdate ? formatTime(lastUpdate) : '-'}
            </span>
            <button
              onClick={fetchVisitorData}
              className="text-surface-400 hover:text-white transition-colors"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 실시간 접속자 수 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-100 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{activeCount}</div>
              <div className="text-xs text-surface-400">현재 접속자</div>
            </div>
          </div>

          <div className="bg-surface-100 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white">
                {stats?.summary?.totalPageviews || 0}
              </div>
              <div className="text-xs text-surface-400">7일 페이지뷰</div>
            </div>
          </div>

          <div className="bg-surface-100 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white">
                {stats?.summary?.totalUniqueVisitors || 0}
              </div>
              <div className="text-xs text-surface-400">7일 순방문자</div>
            </div>
          </div>
        </div>

        {/* 현재 접속자 목록 */}
        {activeSessions.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-surface-400 mb-3">접속 중인 사용자</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeSessions.map((session, index) => (
                <div
                  key={session.session_id || index}
                  className="bg-surface-100 rounded p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <div>
                      <div className="text-sm text-white">
                        {getPageName(session.current_page)}
                      </div>
                      <div className="text-xs text-surface-400">
                        {session.visitor_id?.substring(0, 12)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-surface-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(session.last_seen_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-surface-400 py-8">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>현재 접속자가 없습니다</p>
          </div>
        )}
      </div>

      {/* 일별 통계 */}
      {stats?.daily && stats.daily.length > 0 && (
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">일별 방문 통계</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-surface-400 border-b border-surface-300">
                  <th className="text-left py-2 px-3">날짜</th>
                  <th className="text-right py-2 px-3">순방문자</th>
                  <th className="text-right py-2 px-3">세션</th>
                  <th className="text-right py-2 px-3">페이지뷰</th>
                </tr>
              </thead>
              <tbody>
                {stats.daily.map((day, index) => (
                  <tr
                    key={day.date || index}
                    className="border-b border-surface-300/50 hover:bg-surface-100"
                  >
                    <td className="py-2 px-3 text-white">{formatDate(day.date)}</td>
                    <td className="py-2 px-3 text-right text-surface-300">
                      {day.unique_visitors?.toLocaleString() || 0}
                    </td>
                    <td className="py-2 px-3 text-right text-surface-300">
                      {day.total_sessions?.toLocaleString() || 0}
                    </td>
                    <td className="py-2 px-3 text-right text-surface-300">
                      {day.total_pageviews?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 페이지별 통계 */}
      {stats?.byPage && stats.byPage.length > 0 && (
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">페이지별 통계 (24시간)</h2>
          <div className="space-y-2">
            {stats.byPage.map((page, index) => {
              const maxViews = Math.max(...stats.byPage.map(p => p.views || 0))
              const percentage = maxViews > 0 ? ((page.views || 0) / maxViews) * 100 : 0

              return (
                <div key={page.page_path || index} className="bg-surface-100 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">
                      {getPageName(page.page_path)}
                    </span>
                    <span className="text-surface-400 text-xs">
                      {page.views?.toLocaleString() || 0} views
                    </span>
                  </div>
                  <div className="h-2 bg-surface-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 최근 방문자 */}
      {recentVisitors.length > 0 && (
        <div className="bg-surface-200 border border-surface-300 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">최근 방문자</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentVisitors.map((visitor, index) => (
              <div
                key={visitor.id || index}
                className="bg-surface-100 rounded p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    visitor.is_new_session ? 'bg-green-500' : 'bg-surface-400'
                  }`} />
                  <div>
                    <div className="text-sm text-white">
                      {getPageName(visitor.page_path)}
                    </div>
                    <div className="text-xs text-surface-400">
                      {visitor.visitor_id?.substring(0, 16)}...
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-surface-300">
                    {formatTime(visitor.visited_at)}
                  </div>
                  {visitor.referrer && (
                    <div className="text-xs text-surface-400 truncate max-w-32">
                      {new URL(visitor.referrer).hostname}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
