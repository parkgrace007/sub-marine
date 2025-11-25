import { useEffect, useRef, useCallback } from 'react'

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Singleton pattern for SSE connection
let sharedEventSource = null
let subscribers = new Set()
let reconnectTimeout = null
let isConnecting = false

/**
 * Shared SSE Alert Stream Hook
 * Creates a single SSE connection shared across all components
 *
 * This prevents the issue of 3 separate SSE connections when:
 * - AlertDashboard, AlertPanel, ImportantAlertCard all need alerts
 *
 * Usage:
 *   useAlertStream((alert) => {
 *     // Handle new alert
 *     console.log('New alert:', alert)
 *   })
 */
export function useAlertStream(onAlert) {
  const callbackRef = useRef(onAlert)

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onAlert
  }, [onAlert])

  useEffect(() => {
    // Create subscriber wrapper
    const subscriber = (alert) => {
      if (callbackRef.current) {
        callbackRef.current(alert)
      }
    }

    // Add to subscribers
    subscribers.add(subscriber)
    console.log(`📡 [useAlertStream] Subscriber added (total: ${subscribers.size})`)

    // Connect if not already connected
    if (!sharedEventSource && !isConnecting) {
      connectSharedSSE()
    }

    // Cleanup on unmount
    return () => {
      subscribers.delete(subscriber)
      console.log(`📡 [useAlertStream] Subscriber removed (remaining: ${subscribers.size})`)

      // Close connection if no more subscribers
      if (subscribers.size === 0) {
        closeSharedSSE()
      }
    }
  }, [])
}

function connectSharedSSE() {
  if (isConnecting || sharedEventSource) return

  isConnecting = true
  console.log('🔴 [SSE/Shared] Connecting to alert stream...')

  const eventSource = new EventSource(`${API_URL}/api/alerts/stream`)
  sharedEventSource = eventSource

  eventSource.addEventListener('connected', () => {
    isConnecting = false
    console.log('✅ [SSE/Shared] Connected to alert stream')
  })

  eventSource.addEventListener('alert', (event) => {
    try {
      const alert = JSON.parse(event.data)
      console.log(`🚨 [SSE/Shared] Broadcasting alert to ${subscribers.size} subscribers: [${alert.tier}] ${alert.signal_type}`)

      // Broadcast to all subscribers
      subscribers.forEach(subscriber => {
        try {
          subscriber(alert)
        } catch (e) {
          console.error('❌ [SSE/Shared] Subscriber error:', e)
        }
      })
    } catch (e) {
      console.error('❌ [SSE/Shared] Parse error:', e)
    }
  })

  eventSource.addEventListener('ping', () => {
    // Heartbeat received - connection is alive
  })

  eventSource.onerror = (err) => {
    console.error('❌ [SSE/Shared] Connection error:', err)
    isConnecting = false

    // Close current connection
    if (sharedEventSource) {
      sharedEventSource.close()
      sharedEventSource = null
    }

    // Only reconnect if there are still subscribers
    if (subscribers.size > 0) {
      // Clear any existing reconnect timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }

      console.log('🔄 [SSE/Shared] Reconnecting in 5s...')
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null
        connectSharedSSE()
      }, 5000)
    }
  }
}

function closeSharedSSE() {
  console.log('🔴 [SSE/Shared] Closing connection (no more subscribers)')

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  if (sharedEventSource) {
    sharedEventSource.close()
    sharedEventSource = null
  }

  isConnecting = false
}

export default useAlertStream
