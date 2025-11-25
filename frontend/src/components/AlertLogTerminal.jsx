import React, { useState, useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'

/**
 * AlertLogTerminal - 순수 로그 터미널 컴포넌트
 * 알림 로그를 스크롤 가능한 형태로 표시
 * 새 알림은 타이핑 효과와 함께 표시
 */
function AlertLogTerminal({
  alerts = [],
  title = 'SYSTEM ALERTS',
  className = '',
  emptyState = 'No active alerts'
}) {
  const [typingMessage, setTypingMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const previousAlertsRef = useRef([])
  const typingTimeoutRef = useRef(null)

  // Format timestamp as HH:MM:SS
  const formatTime = (timestamp) => {
    const date = new Date(timestamp || Date.now())
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'text-danger'
      case 'warning': return 'text-warning'
      case 'info': return 'text-info'
      case 'success': return 'text-success'
      default: return 'text-surface-500'
    }
  }

  // Detect new alert and trigger typing effect
  useEffect(() => {
    if (alerts.length === 0) return

    const latestAlert = alerts[0]
    const previousAlerts = previousAlertsRef.current

    // Check if this is a new alert (not in previous list)
    const isNewAlert = previousAlerts.length === 0 ||
                       !previousAlerts.find(prev => prev.id === latestAlert.id)

    if (isNewAlert && latestAlert.message && !isTyping) {
      // Clear any existing typing animation
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      setIsTyping(true)
      setTypingMessage('')

      const message = latestAlert.message
      let currentIndex = 0

      const typeNextChar = () => {
        if (currentIndex < message.length) {
          setTypingMessage(message.substring(0, currentIndex + 1))
          currentIndex++
          typingTimeoutRef.current = setTimeout(typeNextChar, 30) // 30ms per character
        } else {
          setIsTyping(false)
          setTypingMessage('')
        }
      }

      // Start typing after a small delay
      setTimeout(() => typeNextChar(), 50)
    }

    // Update previous alerts reference only after typing check
    if (!isTyping) {
      previousAlertsRef.current = alerts
    }
  }, [alerts, isTyping])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`flex flex-col bg-surface-200 border border-surface-300 rounded-md overflow-hidden shadow-sm ${className}`}>
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-200 border-b border-surface-300">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-surface-500" />
          <span className="text-xs font-bold text-surface-600 tracking-wider">{title}</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-danger/20 border border-danger/50" />
          <div className="w-2 h-2 rounded-full bg-warning/20 border border-warning/50" />
          <div className="w-2 h-2 rounded-full bg-success/20 border border-success/50" />
        </div>
      </div>

      {/* ===== ALERTS LOG ===== */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-0.5 bg-surface-100 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-surface-500 opacity-50 gap-2">
            <span className="text-xl">⚡</span>
            <span>{emptyState}</span>
          </div>
        ) : (
          alerts.map((alert, index) => {
            const isLatest = index === 0
            const showTyping = isLatest && isTyping
            const displayMessage = showTyping ? typingMessage : alert.message

            return (
              <div
                key={alert.id || index}
                className={`flex gap-2 sm:gap-3 p-2 rounded hover:bg-surface-200 transition-colors border-l-2 ${
                  showTyping ? 'border-primary bg-surface-200/50' : 'border-transparent hover:border-primary'
                }`}
              >
                {/* 시간 + 타입 (모바일: 세로, 데스크톱: 가로) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 shrink-0">
                  <span className="text-surface-500 font-mono text-[10px] sm:text-xs">
                    {formatTime(alert.timestamp)}
                  </span>
                  <span className={`font-bold text-[10px] sm:text-xs ${getAlertColor(alert.type || 'info')}`}>
                    [{String(alert.type || 'INFO').toUpperCase()}]
                  </span>
                </div>
                {/* 메시지 */}
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-surface-600 text-[11px] sm:text-xs break-words">
                    {displayMessage}
                    {showTyping && <span className="inline-block w-1.5 h-3 sm:h-3.5 ml-0.5 bg-primary animate-pulse" />}
                  </span>
                  {alert.value && !showTyping && (
                    <span className="text-surface-500 text-[10px] sm:text-xs">
                      Value: <span className="text-surface-600 font-bold">{alert.value}</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AlertLogTerminal
