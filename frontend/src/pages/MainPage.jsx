import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header'
import MainVisualizationSet from '../components/MainVisualizationSet'
import AlertDualPanel from '../components/AlertDualPanel'
import CryptoTrendsFeed from '../components/CryptoTrendsFeed'
import { useIndicatorLogger } from '../hooks/useIndicatorLogger' // Indicator change detection + logs
import { useWhaleData } from '../hooks/useWhaleData'
import soundManager from '../utils/SoundManager'

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Debounce delay for filter changes (prevents rapid API calls)
const FILTER_DEBOUNCE_MS = 300

/**
 * MainPage - Market Sentiment Dashboard
 * Contains the primary market analysis interface with:
 * - Market sentiment visualization (RSI, MACD, Bull/Bear)
 * - Whale visualization (live transactions)
 * - Technical indicator status
 * - Alert terminal
 *
 * Now uses Backend API instead of direct Supabase calls
 */
function MainPage() {
  const { t } = useTranslation()
  const [timeframe, setTimeframe] = useState('8h')
  const [symbol, setSymbol] = useState('통합') // Default to '통합' (ALL) to show all recent whales
  const [isMuted, setIsMuted] = useState(soundManager.getMuted())

  // State variables
  const [alerts, setAlerts] = useState([])

  // Refs
  const whaleCanvasRef = useRef(null)
  const eventSourceRef = useRef(null)
  const timeframeDebounceRef = useRef(null)
  const symbolDebounceRef = useRef(null)

  // Debounced filter handlers (prevents rapid API calls + SSE reconnections)
  const handleTimeframeChange = useCallback((newTimeframe) => {
    if (timeframeDebounceRef.current) {
      clearTimeout(timeframeDebounceRef.current)
    }
    timeframeDebounceRef.current = setTimeout(() => {
      setTimeframe(newTimeframe)
    }, FILTER_DEBOUNCE_MS)
  }, [])

  const handleSymbolChange = useCallback((newSymbol) => {
    if (symbolDebounceRef.current) {
      clearTimeout(symbolDebounceRef.current)
    }
    symbolDebounceRef.current = setTimeout(() => {
      setSymbol(newSymbol)
    }, FILTER_DEBOUNCE_MS)
  }, [])

  // Fetch alerts from Backend API on mount or when filters change
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        console.log(`📥 [MainPage] Fetching alerts via Backend API...`)

        // Build query params
        const params = new URLSearchParams({
          timeframe,
          limit: '100'
        })
        if (symbol !== '통합') {
          params.append('symbol', symbol)
        }

        const response = await fetch(`${API_URL}/api/alerts/indicators?${params}`)

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const json = await response.json()

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch alerts')
        }

        // Convert to alert format
        const formattedAlerts = (json.data || []).map(alert => ({
          id: alert.id,
          timestamp: alert.created_at,
          type: alert.type,
          signal_key: alert.signal_key,
          params: alert.params,
          message: alert.message,
          value: alert.value
        }))

        setAlerts(formattedAlerts)
        const symbolLabel = symbol === '통합' ? 'ALL' : symbol
        console.log(`✅ [MainPage] Loaded ${formattedAlerts.length} alerts for ${timeframe}/${symbolLabel} in ${json.queryTime}ms`)
      } catch (err) {
        console.error('❌ [MainPage] Error fetching alerts:', err)
      }
    }

    fetchAlerts()
  }, [timeframe, symbol])

  // Subscribe to real-time alert updates via SSE
  useEffect(() => {
    function connectSSE() {
      // Build query params for SSE
      const params = new URLSearchParams({ timeframe })
      if (symbol !== '통합') {
        params.append('symbol', symbol)
      }

      console.log(`🔴 [SSE/MainPage] Connecting to indicator alerts stream...`)

      const eventSource = new EventSource(`${API_URL}/api/alerts/indicators/stream?${params}`)
      eventSourceRef.current = eventSource

      eventSource.addEventListener('connected', () => {
        console.log('✅ [SSE/MainPage] Connected to indicator alerts stream')
      })

      eventSource.addEventListener('indicator_alert', (event) => {
        try {
          const alert = JSON.parse(event.data)

          // If symbol is '통합', accept all. Otherwise check symbol match
          if (symbol !== '통합' && alert.symbol !== symbol) {
            return
          }

          console.log(`📨 [SSE/MainPage] New alert: ${alert.type} for ${alert.symbol}/${alert.timeframe}`)

          // Convert to alert format and add to state
          const newAlert = {
            id: alert.id,
            timestamp: alert.created_at,
            type: alert.type,
            signal_key: alert.signal_key,
            params: alert.params,
            message: alert.message,
            value: alert.value
          }

          setAlerts((prev) => {
            // Add new alert to front, keep max 100
            const updated = [newAlert, ...prev]
            return updated.slice(0, 100)
          })
        } catch (e) {
          console.error('❌ [SSE/MainPage] Parse error:', e)
        }
      })

      eventSource.addEventListener('ping', () => {
        // Heartbeat received
      })

      eventSource.onerror = (err) => {
        console.error('❌ [SSE/MainPage] Error:', err)

        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }

        // Reconnect after 5 seconds
        console.log('🔄 [SSE/MainPage] Reconnecting in 5s...')
        setTimeout(connectSSE, 5000)
      }
    }

    connectSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [timeframe, symbol])

  // Handle indicator log generation (단일 지표 로그)
  const handleLogGenerated = useCallback(async (log) => {
    console.log('📝 [MainPage] Indicator log generated:', log)

    try {
      // Save via Backend API
      const response = await fetch(`${API_URL}/api/alerts/indicators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeframe,
          symbol,
          type: log.type,
          signal_key: log.signal_key,
          params: log.params,
          message: log.text,
          value: log.value || null
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to save alert')
      }

      console.log('✅ [MainPage] Alert saved to database:', json.data?.id)
    } catch (err) {
      console.error('❌ [MainPage] Error saving alert:', err)
    }
  }, [timeframe, symbol])

  // Fetch market data + generate logs on indicator changes
  const sentiment = useIndicatorLogger(timeframe, symbol, handleLogGenerated)

  // Fetch whale data - Dashboard shows ONLY inflow/outflow (Refactored 2025-11-24)
  const { whales, loading: whalesLoading, error: whalesError, refetch: refetchWhales } = useWhaleData(timeframe, ['inflow', 'outflow'], symbol)

  // Use real bull_ratio from sentiment, fallback to default if loading
  const bullRatio = sentiment.loading ? 0.5 : sentiment.bull_ratio

  // Control handlers
  const handleMuteToggle = () => {
    const newMutedState = soundManager.toggleMute()
    setIsMuted(newMutedState)
  }

  // Retry handler for database connection errors
  const handleRetry = () => {
    console.log('🔄 [MainPage] Retrying data fetch...')
    if (refetchWhales) {
      refetchWhales()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 text-surface-600 relative">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="flex flex-col gap-6">
          <MainVisualizationSet
            timeframe={timeframe}
            symbol={symbol}
            onSymbolChange={handleSymbolChange}
            onTimeframeChange={handleTimeframeChange}
            isMuted={isMuted}
            onMuteToggle={handleMuteToggle}
            bullRatio={bullRatio}
            sentiment={sentiment}
            whales={whales}
            loading={whalesLoading}
            error={whalesError ? { message: whalesError } : null}
            onRetry={handleRetry}
            whaleCanvasRef={whaleCanvasRef}
          />

          <AlertDualPanel
            alerts={alerts}
            timeframe={timeframe}
            symbol={symbol}
          />

          <CryptoTrendsFeed className="h-auto" />
        </div>
      </main>

      {/* Whale Loading Overlay */}
      {whalesLoading && (
        <div className="fixed top-20 right-6 z-50 bg-surface-200 border border-surface-300 px-4 py-2 rounded shadow-lg">
          {t('common.loading')}
        </div>
      )}
    </div>
  )
}

export default MainPage
