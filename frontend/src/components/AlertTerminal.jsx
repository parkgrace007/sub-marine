import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Terminal, TrendingUp, TrendingDown } from 'lucide-react'
import { useIndicatorLogger } from '../hooks/useIndicatorLogger'

/**
 * AlertTerminal - Integrated trading cockpit dashboard + system alerts
 * Top: 6 compact indicator panels (PRICE, RSI, MACD, BB, VOLUME, MOMENTUM)
 * Bottom: System alerts log (generated from indicator combinations + real-time indicator changes)
 */
function AlertTerminal({ alerts = [], className = '', timeframe = '1h', symbol = '통합' }) {
  const scrollRef = useRef(null)
  const containerRef = useRef(null)

  // State for indicator-generated logs (단일 지표 로그)
  const [indicatorLogs, setIndicatorLogs] = useState([])

  // Log generation callback
  const handleLogGenerated = useCallback((log) => {
    console.log('📝 Indicator log generated:', log)
    setIndicatorLogs((prev) => {
      const newLogs = [...prev, { ...log, id: `${Date.now()}-${Math.random()}` }]
      // Keep last 100 logs
      return newLogs.slice(-100)
    })
  }, [])

  // Fetch real-time market data + generate logs on changes
  const sentiment = useIndicatorLogger(timeframe, symbol, handleLogGenerated)

  // Merge and sort alerts: Supabase alerts + indicator logs
  const mergedAlerts = React.useMemo(() => {
    // Convert alerts to common format
    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      timestamp: alert.timestamp || alert.created_at || new Date().toISOString(),
      type: alert.type || alert.tier?.toLowerCase() || 'info',
      text: alert.message || alert.signal_type || 'Unknown alert'
    }))

    // Indicator logs already in correct format: { id, timestamp, type, text }
    const allAlerts = [...formattedAlerts, ...indicatorLogs]

    // Sort by timestamp (newest first)
    return allAlerts
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100) // Keep last 100
  }, [alerts, indicatorLogs])

  // Auto-scroll to bottom when new alerts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [mergedAlerts])

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'text-danger'
      case 'danger': return 'text-danger' // Support template type
      case 'warning': return 'text-warning'
      case 'info': return 'text-info'
      case 'success': return 'text-success'
      case 'default': return 'text-surface-500' // Support template type
      default: return 'text-surface-500'
    }
  }

  // ===== DATA FORMATTERS =====

  const formatPrice = (price) => {
    if (!price) return 'N/A'
    // Format: $84,354 with comma separators (no decimals)
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  // ===== INDICATOR STATUS CALCULATORS =====

  const getPriceStatus = () => {
    const change = sentiment.price_change_24h
    if (!change) return { value: 'N/A', color: 'text-surface-600', icon: null, sub: '' }
    const isPositive = change >= 0
    return {
      value: formatPrice(sentiment.current_price),
      color: isPositive ? 'text-success' : 'text-danger',
      icon: isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />,
      sub: `${isPositive ? '+' : ''}${change.toFixed(2)}%`
    }
  }

  const getRSIStatus = () => {
    const rsi = sentiment.rsi_average
    if (!rsi) return { value: 'N/A', color: 'text-surface-600', sub: '' }

    // 10-level RSI classification (matches backend alertSystem.js)
    let level, status, color

    if (rsi <= 10) {
      level = 1
      status = '극 과매도'
      color = 'text-danger'
    } else if (rsi <= 20) {
      level = 2
      status = '과매도'
      color = 'text-danger'
    } else if (rsi <= 30) {
      level = 3
      status = '강한 매도세'
      color = 'text-danger'
    } else if (rsi <= 40) {
      level = 4
      status = '매도세'
      color = 'text-warning'
    } else if (rsi <= 50) {
      level = 5
      status = '중립 하단'
      color = 'text-surface-500'
    } else if (rsi <= 60) {
      level = 6
      status = '중립 상단'
      color = 'text-surface-500'
    } else if (rsi <= 70) {
      level = 7
      status = '매수세'
      color = 'text-info'
    } else if (rsi <= 80) {
      level = 8
      status = '강한 매수세'
      color = 'text-success'
    } else if (rsi <= 90) {
      level = 9
      status = '과매수'
      color = 'text-success'
    } else {
      level = 10
      status = '극 과매수'
      color = 'text-success'
    }

    return {
      value: rsi.toFixed(1),
      color,
      sub: `${status} (L${level})`
    }
  }

  const getMACDStatus = () => {
    const macd = sentiment.macd_histogram // Now percentage of price
    if (macd === undefined || macd === null) return { value: 'N/A', color: 'text-surface-600', sub: '' }

    // 7-level MACD classification with percentage-based thresholds
    // Thresholds are now timeframe-independent
    let level, status, color

    if (macd >= 0.5) {
      level = 7
      status = '극 매수세'
      color = 'text-success'
    } else if (macd >= 0.2) {
      level = 6
      status = '강한 매수세'
      color = 'text-success'
    } else if (macd >= 0.05) {
      level = 5
      status = '매수세'
      color = 'text-info'
    } else if (macd >= -0.05) {
      level = 4
      status = '중립'
      color = 'text-surface-500'
    } else if (macd >= -0.2) {
      level = 3
      status = '매도세'
      color = 'text-warning'
    } else if (macd >= -0.5) {
      level = 2
      status = '강한 매도세'
      color = 'text-danger'
    } else {
      level = 1
      status = '극 매도세'
      color = 'text-danger'
    }

    return {
      value: `${macd >= 0 ? '+' : ''}${macd.toFixed(3)}%`,
      color,
      sub: `${status} (L${level})`
    }
  }

  const getBBStatus = () => {
    const width = sentiment.bb_width // Now percentage (0-100)
    if (!width) return { value: 'N/A', color: 'text-surface-600', sub: '' }

    let level, status, color

    // 7-level system based on percentage thresholds
    if (width >= 8.0) {
      level = 7
      status = '극강 확장'
      color = 'text-danger' // Extreme volatility warning
    } else if (width >= 6.0) {
      level = 6
      status = '강한 확장'
      color = 'text-danger'
    } else if (width >= 4.0) {
      level = 5
      status = '확장'
      color = 'text-warning'
    } else if (width >= 2.5) {
      level = 4
      status = '정상'
      color = 'text-surface-500'
    } else if (width >= 1.5) {
      level = 3
      status = '수축'
      color = 'text-info'
    } else if (width >= 1.0) {
      level = 2
      status = '강한 수축'
      color = 'text-info'
    } else {
      level = 1
      status = '극강 수축'
      color = 'text-success' // Squeeze = potential breakout
    }

    return {
      value: `${width.toFixed(2)}%`,
      color,
      sub: `${status} (L${level})`
    }
  }

  const getImportantAlertStatus = () => {
    // 중요알림: 시장 주요 신호 통합 표시
    const rsi = sentiment.rsi_average
    const macd = sentiment.macd_histogram
    const vol_change = sentiment.volume_change_24h

    if (!rsi || !macd) return { value: 'N/A', color: 'text-surface-600', sub: '데이터 없음' }

    // 중요 신호 카운트
    let alertCount = 0
    let alertType = 'NORMAL'
    let color = 'text-surface-600'

    // RSI 극단값 체크
    if (rsi >= 80 || rsi <= 20) alertCount++

    // MACD 강한 신호 체크
    if (Math.abs(macd) > 50) alertCount++

    // 거래량 급증/급락 체크
    if (vol_change && Math.abs(vol_change) > 30) alertCount++

    if (alertCount >= 2) {
      alertType = '위험'
      color = 'text-danger'
    } else if (alertCount === 1) {
      alertType = '주의'
      color = 'text-warning'
    } else {
      alertType = '정상'
      color = 'text-success'
    }

    return {
      value: alertType,
      color,
      sub: `신호: ${alertCount}개`
    }
  }

  const importantAlertStatus = getImportantAlertStatus()
  const priceStatus = getPriceStatus()
  const rsiStatus = getRSIStatus()
  const macdStatus = getMACDStatus()
  const bbStatus = getBBStatus()

  return (
    <div className={`flex flex-col bg-surface-200 border border-surface-300 rounded-md overflow-hidden shadow-sm ${className}`}>
      {/* ===== INDICATOR PANELS GRID (Cockpit Dashboard) ===== */}
      <div className="grid grid-cols-6 gap-2 px-4 py-3 bg-surface-200 border-b border-surface-300">
        {/* 1. 중요알림 (2칸) */}
        <div className="col-span-2 bg-surface-300/60 border border-surface-400/30 p-2 rounded">
          <div className="text-[9px] text-surface-500 mb-0.5 uppercase tracking-wide">중요알림</div>
          <div className={`text-lg font-bold leading-tight ${importantAlertStatus.color}`}>
            {importantAlertStatus.value}
          </div>
          <div className={`text-[10px] ${importantAlertStatus.color}`}>
            {importantAlertStatus.sub}
          </div>
        </div>

        {/* 2. PRICE */}
        <div className="bg-surface-300/60 border border-surface-400/30 p-2 rounded">
          <div className="text-[9px] text-surface-500 mb-0.5 uppercase tracking-wide">PRICE</div>
          <div className={`text-lg font-bold leading-tight ${priceStatus.color}`}>
            {priceStatus.value}
          </div>
          <div className={`flex items-center gap-0.5 text-[10px] ${priceStatus.color}`}>
            {priceStatus.icon}
            <span>{priceStatus.sub}</span>
          </div>
        </div>

        {/* 3. RSI */}
        <div className="bg-surface-300/60 border border-surface-400/30 p-2 rounded">
          <div className="text-[9px] text-surface-500 mb-0.5 uppercase tracking-wide">RSI (14)</div>
          <div className={`text-lg font-bold leading-tight ${rsiStatus.color}`}>
            {rsiStatus.value}
          </div>
          <div className={`text-[10px] ${rsiStatus.color}`}>
            {rsiStatus.sub}
          </div>
        </div>

        {/* 4. MACD */}
        <div className="bg-surface-300/60 border border-surface-400/30 p-2 rounded">
          <div className="text-[9px] text-surface-500 mb-0.5 uppercase tracking-wide">MACD</div>
          <div className={`text-lg font-bold leading-tight ${macdStatus.color}`}>
            {macdStatus.value}
          </div>
          <div className={`text-[10px] ${macdStatus.color}`}>
            {macdStatus.sub}
          </div>
        </div>

        {/* 5. BOLLINGER BANDS */}
        <div className="bg-surface-300/60 border border-surface-400/30 p-2 rounded">
          <div className="text-[9px] text-surface-500 mb-0.5 uppercase tracking-wide">BB WIDTH</div>
          <div className={`text-lg font-bold leading-tight ${bbStatus.color}`}>
            {bbStatus.value}
          </div>
          <div className={`text-[10px] ${bbStatus.color}`}>
            {bbStatus.sub}
          </div>
        </div>
      </div>

      {/* ===== SYSTEM ALERTS HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-200 border-b border-surface-300">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-surface-500" />
          <span className="text-xs font-bold text-surface-600 tracking-wider">SYSTEM ALERTS</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-danger/20 border border-danger/50" />
          <div className="w-2 h-2 rounded-full bg-warning/20 border border-warning/50" />
          <div className="w-2 h-2 rounded-full bg-success/20 border border-success/50" />
        </div>
      </div>

      {/* ===== ALERTS LOG (Supabase alerts + Indicator logs) ===== */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 bg-surface-100 custom-scrollbar">
        {mergedAlerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-surface-500 opacity-50 gap-2">
            <span className="text-xl">⚡</span>
            <span>No active alerts</span>
          </div>
        ) : (
          mergedAlerts.map((alert, index) => (
            <div
              key={alert.id || index}
              className="flex gap-3 p-2 rounded hover:bg-surface-200 transition-colors border-l-2 border-transparent hover:border-primary"
            >
              <span className="text-surface-500 shrink-0">
                {new Date(alert.timestamp || Date.now()).toLocaleTimeString([], { hour12: false })}
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${getAlertColor(alert.type || 'info')}`}>
                    [{String(alert.type || 'INFO').toUpperCase()}]
                  </span>
                  <span className="text-surface-600">{alert.text}</span>
                </div>
                {alert.value && (
                  <span className="text-surface-500">
                    Value: <span className="text-surface-600 font-bold">{alert.value}</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>
    </div>
  )
}

export default AlertTerminal
