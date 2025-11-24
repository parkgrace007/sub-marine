import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * useActivityTracker - Automatic user activity tracking
 *
 * Features:
 * - Tracks user presence for admin dashboard
 * - Sends heartbeat every 30 seconds
 * - Updates current page on navigation
 * - Works for both authenticated and anonymous users
 * - Uses browser session ID for anonymous tracking
 */
export function useActivityTracker() {
  const location = useLocation()
  const { user, profile } = useAuth()
  const sessionIdRef = useRef(null)
  const activityIdRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)

  // Generate or retrieve session ID
  useEffect(() => {
    let sessionId = sessionStorage.getItem('submarine_session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('submarine_session_id', sessionId)
    }
    sessionIdRef.current = sessionId
  }, [])

  // Initialize activity tracking
  useEffect(() => {
    if (!sessionIdRef.current) return

    const initActivity = async () => {
      try {
        // Check if activity record exists for this session
        const { data: existingActivity } = await supabase
          .from('user_activity_logs')
          .select('id')
          .eq('session_id', sessionIdRef.current)
          .single()

        if (existingActivity) {
          // Update existing record
          activityIdRef.current = existingActivity.id
          await updateActivity()
        } else {
          // Create new record
          const { data: newActivity, error } = await supabase
            .from('user_activity_logs')
            .insert({
              session_id: sessionIdRef.current,
              user_id: user?.id || null,
              nickname: profile?.nickname || 'Anonymous',
              is_authenticated: !!user,
              current_page: location.pathname,
              user_agent: navigator.userAgent
            })
            .select('id')
            .single()

          if (error) {
            console.error('Failed to create activity log:', error)
          } else {
            activityIdRef.current = newActivity.id
          }
        }
      } catch (err) {
        console.error('Activity tracking init error:', err)
      }
    }

    initActivity()
  }, [user, profile, location.pathname])

  // Update activity (heartbeat)
  const updateActivity = async () => {
    if (!sessionIdRef.current) return

    try {
      await supabase
        .from('user_activity_logs')
        .update({
          user_id: user?.id || null,
          nickname: profile?.nickname || 'Anonymous',
          is_authenticated: !!user,
          current_page: location.pathname,
          last_activity_at: new Date().toISOString()
        })
        .eq('session_id', sessionIdRef.current)
    } catch (err) {
      console.error('Activity update error:', err)
    }
  }

  // Heartbeat interval (every 30 seconds)
  useEffect(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }

    heartbeatIntervalRef.current = setInterval(() => {
      updateActivity()
    }, 30000) // 30 seconds

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [user, profile, location.pathname])

  // Update on page navigation
  useEffect(() => {
    updateActivity()
  }, [location.pathname])

  // Cleanup on unmount (optional - mark as inactive)
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        // Optional: Could send a "user left" signal here
        // For now, we rely on 5-minute timeout
      }
    }
  }, [])
}
