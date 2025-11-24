import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import TierSummaryPanel from './TierSummaryPanel'
import AlertTerminal from './AlertTerminal'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * AlertDashboard - Main container for the dual-panel alert system
 * Left panel (30%): Tier-based summary
 * Right panel (70%): Terminal-style log
 */
function AlertDashboard({ className = '', style = {} }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch initial alerts
  useEffect(() => {
    fetchRecentAlerts()
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    // Subscribe to new alerts
    const subscription = supabase
      .channel('alerts_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts'
        },
        (payload) => {
          console.log('🚨 New alert received:', payload.new)

          // Add new alert to the beginning of the list
          setAlerts(prev => [payload.new, ...prev].slice(0, 100)) // Keep last 100 alerts

          // Play sound for high-tier alerts
          if (payload.new.tier === 'S' || payload.new.tier === 'A') {
            playAlertSound(payload.new.tier)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Alert subscription active')
        }
      })

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchRecentAlerts = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) {
        console.error('Error fetching alerts:', fetchError)
        setError(fetchError.message)

        // If table doesn't exist, show helpful message
        if (fetchError.message.includes('relation') && fetchError.message.includes('does not exist')) {
          setError('Alert tables not found. Please create database tables first.')
        }
        return
      }

      setAlerts(data || [])
      console.log(`📊 Loaded ${data?.length || 0} recent alerts`)
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
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