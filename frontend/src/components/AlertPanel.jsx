import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabase'
import soundManager from '../utils/SoundManager'

/**
 * AlertPanel - Real-time trading alerts from ALERT_System
 * Shows Tier S, A, B, C signals with appropriate urgency
 */
function AlertPanel({ className = '', style = {} }) {
  const [alerts, setAlerts] = useState([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'S', 'A', 'B', 'C'
  const [autoScroll, setAutoScroll] = useState(true)
  const alertsRef = useRef(null)
  const channelRef = useRef(null)

  // Subscribe to real-time alerts
  useEffect(() => {
    // Fetch initial alerts (last 20)
    fetchRecentAlerts()

    // Subscribe to new alerts
    channelRef.current = supabase
      .channel('alerts-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts'
        },
        (payload) => {
          handleNewAlert(payload.new)
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  // Auto-scroll to newest alert
  useEffect(() => {
    if (autoScroll && alertsRef.current) {
      alertsRef.current.scrollTop = 0
    }
  }, [alerts, autoScroll])

  const fetchRecentAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching alerts:', error)
      return
    }

    setAlerts(data || [])
  }

  const handleNewAlert = (alert) => {
    // Add new alert to top
    setAlerts(prev => [alert, ...prev].slice(0, 50)) // Keep last 50

    // Play sound based on tier
    if (alert.tier === 'S') {
      soundManager.play('alert-critical')
      // Show browser notification for S-tier
      if (Notification.permission === 'granted') {
        new Notification('🚨 CRITICAL ALERT', {
          body: alert.message,
          icon: '/favicon.ico'
        })
      }
    } else if (alert.tier === 'A') {
      soundManager.play('alert-high')
    } else if (alert.tier === 'B') {
      soundManager.play('alert-medium')
    }
    // C-tier: no sound (too frequent)
  }

  // Filter alerts by tier
  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.tier === filter)

  // Get tier statistics
  const tierCounts = {
    S: alerts.filter(a => a.tier === 'S').length,
    A: alerts.filter(a => a.tier === 'A').length,
    B: alerts.filter(a => a.tier === 'B').length,
    C: alerts.filter(a => a.tier === 'C').length
  }

  const getTierStyle = (tier) => {
    switch (tier) {
      case 'S':
        return 'bg-tier-s text-primary-text tier-s-glow animate-pulse'
      case 'A':
        return 'bg-tier-a text-primary-text'
      case 'B':
        return 'bg-tier-b text-primary-text'
      case 'C':
        return 'bg-tier-c text-surface-600'
      default:
        return 'bg-surface-500 text-surface-600'
    }
  }

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'S': return { icon: '/icons/outflow.png', isImage: true }
      case 'A': return { icon: '🟠', isImage: false }
      case 'B': return { icon: '🟡', isImage: false }
      case 'C': return { icon: '⚪', isImage: false }
      default: return { icon: '⚫', isImage: false }
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      className={`
        bg-surface-200 border border-surface-300
        rounded-md shadow-lg overflow-hidden
        transition-all duration-300
        ${isMinimized ? 'h-12' : 'h-96'}
        ${className}
      `}
      style={style}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-300">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-surface-600">
            🚨 ALERT SYSTEM
          </h3>
          {!isMinimized && (
            <div className="flex items-center gap-1">
              <span
                className="text-xs text-surface-500 hover:text-surface-600 cursor-pointer"
                onClick={() => setFilter('all')}
              >
                All ({filteredAlerts.length})
              </span>
              {Object.entries(tierCounts).map(([tier, count]) => (
                <button
                  key={tier}
                  onClick={() => setFilter(tier)}
                  className={`
                    px-2 py-0.5 text-xs rounded transition-all
                    ${filter === tier
                      ? getTierStyle(tier)
                      : 'bg-primary/10 text-surface-500 hover:bg-primary/20'
                    }
                  `}
                >
                  {tier} ({count})
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isMinimized && (
            <>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`
                  px-2 py-0.5 text-xs rounded transition-all
                  ${autoScroll
                    ? 'bg-success text-primary-text font-bold'
                    : 'bg-primary/10 text-surface-500 hover:bg-primary/20'
                  }
                `}
                title="Auto-scroll"
              >
                📜
              </button>
              <button
                onClick={fetchRecentAlerts}
                className="btn-secondary text-xs"
                title="Refresh"
              >
                🔄
              </button>
            </>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-surface-500 hover:text-surface-600"
          >
            {isMinimized ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Alert List */}
      {!isMinimized && (
        <div
          ref={alertsRef}
          className="overflow-y-auto h-[calc(100%-3rem)] p-2 space-y-1"
        >
          {filteredAlerts.length === 0 ? (
            <div className="text-center text-surface-500 opacity-40 py-8">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm">No alerts yet</div>
              <div className="text-xs mt-1">Monitoring market conditions...</div>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`
                  flex items-start gap-2 p-2 rounded
                  bg-surface-100/50 hover:bg-surface-400/30 transition-all
                  ${alert.tier === 'S' ? 'border border-danger/50' : ''}
                `}
              >
                {/* Tier Badge */}
                <div className={`
                  px-2 py-1 rounded text-xs font-bold flex items-center gap-1
                  ${getTierStyle(alert.tier)}
                `}>
                  {(() => {
                    const tierIcon = getTierIcon(alert.tier)
                    return tierIcon.isImage ? (
                      <img src={tierIcon.icon} alt={`Tier ${alert.tier}`} className="w-4 h-4 object-contain" />
                    ) : (
                      <span>{tierIcon.icon}</span>
                    )
                  })()}
                  {alert.tier}
                </div>

                {/* Alert Content */}
                <div className="flex-1">
                  <div className="text-sm text-surface-600">
                    {alert.message}
                  </div>
                  {alert.signal_type && (
                    <div className="text-xs text-surface-500 mt-1">
                      {alert.signal_type} • {alert.timeframe || 'Global'}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-xs text-surface-500">
                  {formatTime(alert.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Status Bar (when minimized) */}
      {isMinimized && filteredAlerts.length > 0 && (
        <div className="px-4 text-xs text-surface-500">
          Latest: {filteredAlerts[0]?.message?.substring(0, 50)}...
        </div>
      )}
    </div>
  )
}

export default AlertPanel