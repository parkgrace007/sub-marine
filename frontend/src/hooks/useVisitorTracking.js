/**
 * useVisitorTracking - 방문자 추적 훅
 * - 페이지 방문 시 자동 기록
 * - 30초마다 heartbeat 전송
 * - 페이지 떠날 때 disconnect
 */

import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// 브라우저별 고유 ID 생성 (localStorage에 저장)
const getVisitorId = () => {
  let visitorId = localStorage.getItem('submarine_visitor_id')
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('submarine_visitor_id', visitorId)
  }
  return visitorId
}

// 세션 ID 생성 (sessionStorage에 저장)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('submarine_session_id')
  const isNewSession = !sessionId

  if (!sessionId) {
    sessionId = 's_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    sessionStorage.setItem('submarine_session_id', sessionId)
  }

  return { sessionId, isNewSession }
}

export function useVisitorTracking() {
  const location = useLocation()
  const heartbeatRef = useRef(null)
  const trackedPathRef = useRef(null)
  const visitorIdRef = useRef(getVisitorId())

  // 방문 기록 전송
  const trackVisit = useCallback(async (pagePath, isNewSession = false) => {
    try {
      const { sessionId } = getSessionId()

      await fetch(`${API_URL}/api/visitors/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: visitorIdRef.current,
          sessionId,
          pagePath,
          referrer: document.referrer || null,
          userAgent: navigator.userAgent,
          isNewSession
        })
      })
    } catch (err) {
      // 실패해도 사용자 경험에 영향 없음
      console.warn('[Visitor] Track failed:', err.message)
    }
  }, [])

  // Heartbeat 전송
  const sendHeartbeat = useCallback(async () => {
    try {
      const { sessionId } = getSessionId()

      await fetch(`${API_URL}/api/visitors/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          pagePath: location.pathname
        })
      })
    } catch (err) {
      // 실패해도 무시
    }
  }, [location.pathname])

  // 연결 종료
  const disconnect = useCallback(async () => {
    try {
      const { sessionId } = getSessionId()

      // sendBeacon 사용 (페이지 떠날 때 안정적)
      const data = JSON.stringify({ sessionId })

      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${API_URL}/api/visitors/disconnect`, data)
      } else {
        await fetch(`${API_URL}/api/visitors/disconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true
        })
      }
    } catch (err) {
      // 실패해도 무시
    }
  }, [])

  // 페이지 변경 감지
  useEffect(() => {
    const currentPath = location.pathname
    const { isNewSession } = getSessionId()

    // 같은 페이지면 무시
    if (trackedPathRef.current === currentPath) {
      return
    }

    trackedPathRef.current = currentPath

    // 방문 기록 (새 세션일 때만 DB에 저장)
    trackVisit(currentPath, isNewSession)

    // 새 세션이면 sessionStorage 플래그 업데이트
    if (isNewSession) {
      sessionStorage.setItem('submarine_session_tracked', 'true')
    }
  }, [location.pathname, trackVisit])

  // Heartbeat 설정 (30초마다)
  useEffect(() => {
    // 초기 heartbeat
    sendHeartbeat()

    // 30초 간격으로 heartbeat
    heartbeatRef.current = setInterval(sendHeartbeat, 30 * 1000)

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [sendHeartbeat])

  // 페이지 떠날 때 disconnect
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        disconnect()
      } else if (document.visibilityState === 'visible') {
        // 다시 돌아오면 heartbeat
        sendHeartbeat()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      disconnect()
    }
  }, [disconnect, sendHeartbeat])

  return {
    visitorId: visitorIdRef.current,
    sessionId: getSessionId().sessionId
  }
}

export default useVisitorTracking
