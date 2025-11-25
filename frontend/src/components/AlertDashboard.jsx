import React, { useState, useEffect, useRef } from 'react'
import TierSummaryPanel from './TierSummaryPanel'
import AlertTerminal from './AlertTerminal'

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * AlertDashboard - Main container for the dual-panel alert system
 * Left panel (30%): Tier-based summary
 * Right panel (70%): Terminal-style log
 *
 * Now uses Backend API instead of direct Supabase calls
 */
function AlertDashboard({ className = '', style = {} }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const eventSourceRef = useRef(null)

  // Fetch initial alerts from Backend API
  useEffect(() => {
    fetchRecentAlerts()
  }, [])

  // Set up SSE connection for real-time updates
  useEffect(() => {
    connectSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  const fetchRecentAlerts = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔔 [AlertDashboard] Fetching alerts via Backend API...')

      const response = await fetch(`${API_URL}/api/alerts?limit=50`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch alerts')
      }

      setAlerts(json.data || [])
      console.log(`✅ [AlertDashboard] Loaded ${json.data?.length || 0} alerts in ${json.queryTime}ms`)
    } catch (err) {
      console.error('❌ [AlertDashboard] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const connectSSE = () => {
    console.log('🔴 [SSE/Alerts] Connecting to alert stream...')

    const eventSource = new EventSource(`${API_URL}/api/alerts/stream`)
    eventSourceRef.current = eventSource

    eventSource.addEventListener('connected', (event) => {
      console.log('✅ [SSE/Alerts] Connected to alert stream')
    })

    eventSource.addEventListener('alert', (event) => {
      try {
        const alert = JSON.parse(event.data)
        console.log(`🚨 [SSE/Alerts] New alert: [${alert.tier}] ${alert.signal_type}`)

        // Add new alert to the beginning of the list
        setAlerts(prev => [alert, ...prev].slice(0, 100)) // Keep last 100 alerts

        // Play sound for high-tier alerts
        if (alert.tier === 'S' || alert.tier === 'A') {
          playAlertSound(alert.tier)
        }
      } catch (e) {
        console.error('❌ [SSE/Alerts] Parse error:', e)
      }
    })

    eventSource.addEventListener('ping', () => {
      // Heartbeat received
    })

    eventSource.onerror = (err) => {
      console.error('❌ [SSE/Alerts] Error:', err)

      // Close current connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      // Reconnect after 5 seconds
      console.log('🔄 [SSE/Alerts] Reconnecting in 5s...')
      setTimeout(connectSSE, 5000)
    }
  }

  const playAlertSound = (tier) => {
    // Optional: Add sound effects for different tiers
    try {
      const audio = new Audio()
      if (tier === 'S') {
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHG7A7+OZURE='
        audio.play().catch(() => { }) // Critical alert sound
      } else if (tier === 'A') {
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LM'
        audio.play().catch(() => { }) // Action alert sound
      }
    } catch (e) {
      console.log('Audio playback failed:', e)
    }
  }

  // Separate combined alerts for left panel (only show most recent per tier)
  const combinedAlerts = alerts.filter(a =>
    a.signal_type && a.signal_type.includes('-')
  )

  return (
    <div
      className={`bg-surface-200/95 border-t border-surface-300 ${className}`}
      style={{ height: '320px', ...style }}
    >
      {/* Container Title - Hidden */}
      <div className="px-4 py-2 border-b border-surface-300" style={{ display: 'none' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-surface-600 opacity-80">
          </h3>
          <div className="flex items-center gap-3 text-xs">
            {loading && (
              <span className="text-primary flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              </span>
            )}
            {error && (
              <span className="text-danger">
              </span>
            )}
            {!loading && !error && (
              <span className="text-success">
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dual Panel Layout */}
      <div className="flex gap-4 p-4 h-full">
        {/* Left Panel: Tier Summary (30%) */}
        <div className="w-[30%]">
          <TierSummaryPanel
            alerts={combinedAlerts}
            className="h-full"
          />
        </div>

        {/* Right Panel: Alert Terminal (70%) */}
        <div className="w-[70%]">
          <AlertTerminal
            alerts={alerts}
            className="h-full"
          />
        </div>
      </div>

      {/* Debug Info (only in development) */}
      {import.meta.env.DEV && (
        <div className="absolute bottom-2 right-2 text-xs text-white/20">
          Total: {alerts.length} | Combined: {combinedAlerts.length}
        </div>
      )}
    </div>
  )
}

export default AlertDashboard
