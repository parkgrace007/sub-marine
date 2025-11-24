import React, { useState, useRef, useCallback, useEffect } from 'react'
import Header from '../components/Header'
import MainVisualizationSet from '../components/MainVisualizationSet'
import AlertDualPanel from '../components/AlertDualPanel'
import CryptoTrendsFeed from '../components/CryptoTrendsFeed'
import DevDrawer from '../components/DevDrawer'
import { useIndicatorLogger } from '../hooks/useIndicatorLogger' // Indicator change detection + logs
import { useWhaleData } from '../hooks/useWhaleData'
import soundManager from '../utils/SoundManager'
import { supabase } from '../utils/supabase'

/**
 * MainPage - Market Sentiment Dashboard
 * Contains the primary market analysis interface with:
 * - Market sentiment visualization (RSI, MACD, Bull/Bear)
 * - Whale visualization (live transactions)
 * - Technical indicator status
 * - Alert terminal
 */
function MainPage() {
  const [timeframe, setTimeframe] = useState('8h')
  const [symbol, setSymbol] = useState('통합') // Default to '통합' (ALL) to show all recent whales
  const [isMuted, setIsMuted] = useState(soundManager.getMuted())

  // State variables
  const [alerts, setAlerts] = useState([])
  const [isDevDashboardOpen, setIsDevDashboardOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // Refs
  const whaleCanvasRef = useRef(null)

  // Fetch alerts from Supabase on mount or when filters change
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Build query with optional symbol filter
        let query = supabase
          .from('indicator_alerts')
          .select('*')
          .eq('timeframe', timeframe)

        // Only add symbol filter if not '통합' (ALL)
        if (symbol !== '통합') {
          query = query.eq('symbol', symbol)
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) {
          console.error('❌ [MainPage] Error fetching alerts:', error)
          return
        }

        // Convert Supabase format to alert format
        const formattedAlerts = data.map(alert => ({
          id: alert.id,
          timestamp: alert.created_at,
          type: alert.type,
          message: alert.message,
          value: alert.value
        }))

        setAlerts(formattedAlerts)
        const symbolLabel = symbol === '통합' ? 'ALL' : symbol
        console.log(`📥 [MainPage] Loaded ${formattedAlerts.length} alerts for ${timeframe}/${symbolLabel}`)
      } catch (err) {
        console.error('❌ [MainPage] Error:', err)
      }
    }

    fetchAlerts()
  }, [timeframe, symbol])

  // Subscribe to real-time alert updates
  useEffect(() => {
    // Build filter: only add symbol filter if not '통합'
    const filter = symbol === '통합'
      ? `timeframe=eq.${timeframe}`
      : `timeframe=eq.${timeframe},symbol=eq.${symbol}`

    const channel = supabase
      .channel(`indicator_alerts_${timeframe}_${symbol}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'indicator_alerts',
          filter: filter
        },
        (payload) => {
          console.log('📨 [MainPage] New alert received:', payload.new)

          // If symbol is '통합', accept all. Otherwise check symbol match
          if (symbol !== '통합' && payload.new.symbol !== symbol) {
            return
          }

          // Convert to alert format and add to state
          const newAlert = {
            id: payload.new.id,
            timestamp: payload.new.created_at,
            type: payload.new.type,
            message: payload.new.message,
            value: payload.new.value
          }

          setAlerts((prev) => {
            // Add new alert to front, keep max 100
            const updated = [newAlert, ...prev]
            return updated.slice(0, 100)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [timeframe, symbol])

  // Handle indicator log generation (단일 지표 로그)
  const handleLogGenerated = useCallback(async (log) => {
    console.log('📝 [MainPage] Indicator log generated:', log)

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('indicator_alerts')
        .insert({
          timeframe,
          symbol,
          type: log.type,
          message: log.text,
          value: log.value || null
        })
        .select()
        .single()

      if (error) {
        console.error('❌ [MainPage] Error saving alert:', error)
        return
      }

      console.log('✅ [MainPage] Alert saved to database:', data.id)
    } catch (err) {
      console.error('❌ [MainPage] Error:', err)
    }
  }, [timeframe, symbol])

  // Fetch market data + generate logs on indicator changes
  const sentiment = useIndicatorLogger(timeframe, symbol, handleLogGenerated)

  // Fetch whale data (only inflow/outflow = market pressure, filtered by symbol)
  const { whales, loading: whalesLoading, error: whalesError } = useWhaleData(timeframe, ['inflow', 'outflow'], symbol)

  // Use real bull_ratio from sentiment, fallback to default if loading
  const bullRatio = sentiment.loading ? 0.5 : sentiment.bull_ratio

  // Control handlers
  const handleMuteToggle = () => {
    const newMutedState = soundManager.toggleMute()
    setIsMuted(newMutedState)
  }

  return (
    <div className="min-h-screen bg-surface-100 text-surface-600 relative">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex flex-col gap-6">
          {/* Whale Error Notification */}
          {whalesError && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded">
              고래 데이터 로드 실패: {whalesError}
            </div>
          )}

          <MainVisualizationSet
            timeframe={timeframe}
            symbol={symbol}
            onSymbolChange={setSymbol}
            onTimeframeChange={setTimeframe}
            isMuted={isMuted}
            onMuteToggle={handleMuteToggle}
            bullRatio={bullRatio}
            sentiment={sentiment}
            whales={whales}
            loading={whalesLoading}
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

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-200 border border-danger text-white px-6 py-4 rounded-md shadow-lg flex items-center gap-3 animate-slide-in-fade">
          <span>💾</span>
          <div>
            <h4 className="font-bold text-sm">Settings Saved</h4>
            <p className="text-xs opacity-80">Your preferences have been updated.</p>
          </div>
        </div>
      )}

      {/* Whale Loading Overlay */}
      {whalesLoading && (
        <div className="fixed top-20 right-6 z-50 bg-surface-200 border border-surface-300 px-4 py-2 rounded shadow-lg">
          고래 데이터 로딩 중...
        </div>
      )}

      {/* Dev Dashboard Drawer */}
      <DevDrawer
        isOpen={isDevDashboardOpen}
        onClose={() => setIsDevDashboardOpen(false)}
        alerts={alerts}
        whales={whales}
      />

      {/* Developer Trigger Area (Bottom Left Corner) */}
      <div
        className="fixed bottom-0 left-0 w-4 h-4 z-50 cursor-crosshair opacity-0 hover:opacity-100"
        onDoubleClick={() => setIsDevDashboardOpen(true)}
        title="Double click for Dev Dashboard"
      />
    </div>
  )
}

export default MainPage
