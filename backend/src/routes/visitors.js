/**
 * Visitor Tracking API Routes
 * 실시간 접속자 및 방문 기록 추적
 */

import express from 'express'
import { supabase } from '../utils/supabase.js'
import { verifyToken, requireRole } from '../middleware/adminAuth.js'

const router = express.Router()

// 메모리 기반 실시간 접속자 (빠른 응답용)
const activeSessions = new Map()

// 2분 타임아웃 (밀리초)
const SESSION_TIMEOUT = 2 * 60 * 1000

// 비활성 세션 정리 (1분마다)
setInterval(() => {
  const now = Date.now()
  let cleaned = 0

  for (const [sessionId, session] of activeSessions) {
    if (now - session.lastSeen > SESSION_TIMEOUT) {
      activeSessions.delete(sessionId)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 [Visitors] Cleaned ${cleaned} inactive sessions. Active: ${activeSessions.size}`)
  }
}, 60 * 1000)

// =====================================================
// PUBLIC ENDPOINTS (방문자용)
// =====================================================

/**
 * POST /api/visitors/track
 * 페이지 방문 기록 + heartbeat
 */
router.post('/track', async (req, res) => {
  try {
    const {
      visitorId,
      sessionId,
      pagePath,
      referrer,
      userAgent,
      isNewSession = false
    } = req.body

    if (!visitorId || !sessionId || !pagePath) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const now = Date.now()

    // 1. 메모리에 세션 업데이트 (실시간 접속자용)
    activeSessions.set(sessionId, {
      visitorId,
      pagePath,
      lastSeen: now,
      connectedAt: activeSessions.get(sessionId)?.connectedAt || now
    })

    // 2. 새 세션이면 DB에 방문 로그 기록
    if (isNewSession) {
      const { error } = await supabase
        .from('visitor_logs')
        .insert({
          visitor_id: visitorId,
          session_id: sessionId,
          page_path: pagePath,
          referrer: referrer || null,
          user_agent: userAgent || null,
          is_new_session: true
        })

      if (error) {
        console.error('❌ [Visitors] Failed to log visit:', error.message)
      }
    }

    // 3. active_sessions 테이블 업데이트 (upsert)
    const { error: sessionError } = await supabase
      .from('active_sessions')
      .upsert({
        session_id: sessionId,
        visitor_id: visitorId,
        current_page: pagePath,
        is_active: true,
        last_seen_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })

    if (sessionError) {
      console.error('❌ [Visitors] Failed to update session:', sessionError.message)
    }

    res.json({
      success: true,
      activeCount: activeSessions.size
    })

  } catch (err) {
    console.error('❌ [Visitors] Track error:', err.message)
    res.status(500).json({ error: 'Failed to track visit' })
  }
})

/**
 * POST /api/visitors/heartbeat
 * 세션 heartbeat (30초마다 호출)
 */
router.post('/heartbeat', async (req, res) => {
  try {
    const { sessionId, pagePath } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' })
    }

    const session = activeSessions.get(sessionId)

    if (session) {
      session.lastSeen = Date.now()
      session.pagePath = pagePath || session.pagePath
    }

    // DB도 업데이트
    await supabase
      .from('active_sessions')
      .update({
        current_page: pagePath,
        last_seen_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)

    res.json({
      success: true,
      activeCount: activeSessions.size
    })

  } catch (err) {
    console.error('❌ [Visitors] Heartbeat error:', err.message)
    res.status(500).json({ error: 'Failed to update heartbeat' })
  }
})

/**
 * POST /api/visitors/disconnect
 * 세션 종료 (페이지 떠날 때)
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' })
    }

    // 메모리에서 제거
    activeSessions.delete(sessionId)

    // DB 업데이트
    await supabase
      .from('active_sessions')
      .update({
        is_active: false,
        disconnected_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)

    res.json({ success: true })

  } catch (err) {
    console.error('❌ [Visitors] Disconnect error:', err.message)
    res.status(500).json({ error: 'Failed to disconnect' })
  }
})

/**
 * GET /api/visitors/count
 * 실시간 접속자 수 (공개)
 */
router.get('/count', (req, res) => {
  res.json({
    count: activeSessions.size,
    timestamp: Date.now()
  })
})

// =====================================================
// ADMIN ENDPOINTS (관리자용)
// =====================================================

/**
 * GET /api/visitors/admin/realtime
 * 실시간 접속자 상세 정보
 */
router.get('/admin/realtime', verifyToken, requireRole(['admin', 'super_admin']), (req, res) => {
  const sessions = []

  for (const [sessionId, session] of activeSessions) {
    sessions.push({
      sessionId,
      visitorId: session.visitorId,
      pagePath: session.pagePath,
      lastSeen: session.lastSeen,
      connectedAt: session.connectedAt,
      duration: Math.floor((Date.now() - session.connectedAt) / 1000) // 초 단위
    })
  }

  // 최근 접속 순 정렬
  sessions.sort((a, b) => b.lastSeen - a.lastSeen)

  res.json({
    count: sessions.length,
    sessions,
    timestamp: Date.now()
  })
})

/**
 * GET /api/visitors/admin/stats
 * 방문 통계 (일별)
 */
router.get('/admin/stats', verifyToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7

    const { data, error } = await supabase
      .from('visitor_logs')
      .select('visited_at, visitor_id, session_id, user_id, page_path')
      .gte('visited_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('visited_at', { ascending: false })

    if (error) throw error

    // 일별 통계 계산
    const dailyStats = {}
    const pageStats = {}

    data?.forEach(log => {
      const date = log.visited_at.split('T')[0]

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          visitors: new Set(),
          sessions: new Set(),
          pageviews: 0,
          loggedInUsers: new Set()
        }
      }

      dailyStats[date].visitors.add(log.visitor_id)
      dailyStats[date].sessions.add(log.session_id)
      dailyStats[date].pageviews++
      if (log.user_id) {
        dailyStats[date].loggedInUsers.add(log.user_id)
      }

      // 페이지별 통계
      if (!pageStats[log.page_path]) {
        pageStats[log.page_path] = { views: 0, visitors: new Set() }
      }
      pageStats[log.page_path].views++
      pageStats[log.page_path].visitors.add(log.visitor_id)
    })

    // Set을 숫자로 변환
    const dailyResult = Object.values(dailyStats).map(stat => ({
      date: stat.date,
      uniqueVisitors: stat.visitors.size,
      totalSessions: stat.sessions.size,
      pageviews: stat.pageviews,
      loggedInUsers: stat.loggedInUsers.size
    }))

    const pageResult = Object.entries(pageStats)
      .map(([path, stat]) => ({
        path,
        views: stat.views,
        uniqueVisitors: stat.visitors.size
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    res.json({
      daily: dailyResult,
      pages: pageResult,
      summary: {
        totalVisitors: new Set(data?.map(d => d.visitor_id)).size,
        totalPageviews: data?.length || 0,
        period: `Last ${days} days`
      }
    })

  } catch (err) {
    console.error('❌ [Visitors] Stats error:', err.message)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

/**
 * GET /api/visitors/admin/recent
 * 최근 방문자 목록
 */
router.get('/admin/recent', verifyToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50

    const { data, error } = await supabase
      .from('visitor_logs')
      .select('*')
      .order('visited_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    res.json({
      visitors: data,
      count: data?.length || 0
    })

  } catch (err) {
    console.error('❌ [Visitors] Recent error:', err.message)
    res.status(500).json({ error: 'Failed to fetch recent visitors' })
  }
})

/**
 * POST /api/visitors/admin/cleanup
 * 수동 정리 (30일 이상 로그 삭제)
 */
router.post('/admin/cleanup', verifyToken, requireRole(['super_admin']), async (req, res) => {
  try {
    // visitor_logs 정리
    const { data: logsDeleted, error: logsError } = await supabase
      .from('visitor_logs')
      .delete()
      .lt('visited_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .select('id')

    if (logsError) throw logsError

    // 비활성 세션 정리
    const { data: sessionsDeleted, error: sessionsError } = await supabase
      .from('active_sessions')
      .delete()
      .eq('is_active', false)
      .lt('disconnected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .select('id')

    if (sessionsError) throw sessionsError

    res.json({
      success: true,
      deleted: {
        logs: logsDeleted?.length || 0,
        sessions: sessionsDeleted?.length || 0
      }
    })

  } catch (err) {
    console.error('❌ [Visitors] Cleanup error:', err.message)
    res.status(500).json({ error: 'Failed to cleanup' })
  }
})

export default router
