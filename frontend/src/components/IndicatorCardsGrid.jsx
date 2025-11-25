import React from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useMarketData } from '../hooks/useMarketData'

/**
 * IndicatorCardsGrid - 6개 지표 카드를 그리드로 표시
 * PRICE, RSI, MACD, BB WIDTH, VOLUME, FEAR & GREED
 */
function IndicatorCardsGrid({ timeframe = '1h', symbol = '통합' }) {
  const { t } = useTranslation()
  // Fetch real-time market data
  const sentiment = useMarketData(timeframe, symbol)

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
    let level, statusKey, color

    if (rsi <= 10) {
      level = 1
      statusKey = 'extremeOversold'
      color = 'text-danger'
    } else if (rsi <= 20) {
      level = 2
      statusKey = 'oversold'
      color = 'text-danger'
    } else if (rsi <= 30) {
      level = 3
      statusKey = 'strongSell'
      color = 'text-danger'
    } else if (rsi <= 40) {
      level = 4
      statusKey = 'sell'
      color = 'text-warning'
    } else if (rsi <= 50) {
      level = 5
      statusKey = 'neutralLow'
      color = 'text-surface-500'
    } else if (rsi <= 60) {
      level = 6
      statusKey = 'neutralHigh'
      color = 'text-surface-500'
    } else if (rsi <= 70) {
      level = 7
      statusKey = 'buy'
      color = 'text-info'
    } else if (rsi <= 80) {
      level = 8
      statusKey = 'strongBuy'
      color = 'text-success'
    } else if (rsi <= 90) {
      level = 9
      statusKey = 'overbought'
      color = 'text-success'
    } else {
      level = 10
      statusKey = 'extremeOverbought'
      color = 'text-success'
    }

    return {
      value: rsi.toFixed(1),
      color,
      sub: `${t(`indicators.rsi.${statusKey}`)} (L${level})`
    }
  }

  const getMACDStatus = () => {
    const macdPercent = sentiment.macd_histogram // Normalized percentage for level calculation
    const macdRaw = sentiment.macd_histogram_raw // Raw histogram value for display

    if (macdPercent === undefined || macdPercent === null || macdRaw === undefined || macdRaw === null) {
      return { value: 'N/A', color: 'text-surface-600', sub: '' }
    }

    // 7-level MACD classification with percentage-based thresholds
    // Thresholds are timeframe-independent
    let level, statusKey, color

    if (macdPercent >= 0.5) {
      level = 7
      statusKey = 'extremeBuy'
      color = 'text-success'
    } else if (macdPercent >= 0.2) {
      level = 6
      statusKey = 'strongBuy'
      color = 'text-success'
    } else if (macdPercent >= 0.05) {
      level = 5
      statusKey = 'buy'
      color = 'text-info'
    } else if (macdPercent >= -0.05) {
      level = 4
      statusKey = 'neutral'
      color = 'text-surface-500'
    } else if (macdPercent >= -0.2) {
      level = 3
      statusKey = 'sell'
      color = 'text-warning'
    } else if (macdPercent >= -0.5) {
      level = 2
      statusKey = 'strongSell'
      color = 'text-danger'
    } else {
      level = 1
      statusKey = 'extremeSell'
      color = 'text-danger'
    }

    return {
      // Main value: Raw histogram (trader-friendly)
      value: `${macdRaw >= 0 ? '+' : ''}${macdRaw.toFixed(2)}`,
      color,
      // Sub text: Status with percentage in parentheses
      sub: `${t(`indicators.macd.${statusKey}`)} (${macdPercent >= 0 ? '+' : ''}${macdPercent.toFixed(3)}%)`
    }
  }

  const getBBStatus = () => {
    const width = sentiment.bb_width // Now percentage (0-100)
    if (!width) return { value: 'N/A', color: 'text-surface-600', sub: '' }

    let level, statusKey, color

    // 7-level system based on percentage thresholds
    if (width >= 8.0) {
      level = 7
      statusKey = 'maxExpansion'
      color = 'text-danger' // Extreme volatility warning
    } else if (width >= 6.0) {
      level = 6
      statusKey = 'strongExpansion'
      color = 'text-danger'
    } else if (width >= 4.0) {
      level = 5
      statusKey = 'weakExpansion'
      color = 'text-warning'
    } else if (width >= 2.5) {
      level = 4
      statusKey = 'normal'
      color = 'text-surface-500'
    } else if (width >= 1.5) {
      level = 3
      statusKey = 'weakContraction'
      color = 'text-info'
    } else if (width >= 1.0) {
      level = 2
      statusKey = 'strongContraction'
      color = 'text-info'
    } else {
      level = 1
      statusKey = 'maxContraction'
      color = 'text-success' // Squeeze = potential breakout
    }

    return {
      value: `${width.toFixed(2)}%`,
      color,
      sub: `${t(`indicators.bb.${statusKey}`)} (L${level})`
    }
  }

  const getVolumeStatus = () => {
    const volRatio = sentiment.volRatio
    const volStatus = sentiment.volStatus
    if (!volRatio) return { value: 'N/A', color: 'text-surface-600', sub: '' }

    // 4-level volume classification (matches LOG_TEMPLATES.VOLUME)
    let level, statusKey, color

    if (volStatus === 'EXPLOSIVE') {
      level = 4
      statusKey = 'explosive'
      color = 'text-warning' // High volatility warning
    } else if (volStatus === 'ACTIVE') {
      level = 3
      statusKey = 'active'
      color = 'text-success'
    } else if (volStatus === 'NORMAL') {
      level = 2
      statusKey = 'normal'
      color = 'text-surface-500'
    } else { // CALM
      level = 1
      statusKey = 'silent'
      color = 'text-info'
    }

    return {
      value: `${volRatio.toFixed(2)}x`,
      color,
      sub: `${t(`indicators.volume.${statusKey}`)} (L${level})`
    }
  }

  const getFearGreedStatus = () => {
    // Calculate Fear & Greed Index based on RSI
    // RSI 0-100 maps to Fear & Greed 0-100
    const rsi = sentiment.rsi_average
    if (!rsi) return { value: 'N/A', color: 'text-surface-600', sub: '' }

    // Convert RSI to Fear & Greed scale (0-100)
    const fearGreedValue = rsi

    let statusKey, color

    // 5-level Fear & Greed classification
    if (fearGreedValue >= 75) {
      statusKey = 'extremeGreed'
      color = 'text-success'
    } else if (fearGreedValue >= 55) {
      statusKey = 'greed'
      color = 'text-info'
    } else if (fearGreedValue >= 45) {
      statusKey = 'neutral'
      color = 'text-surface-500'
    } else if (fearGreedValue >= 25) {
      statusKey = 'fear'
      color = 'text-warning'
    } else {
      statusKey = 'extremeFear'
      color = 'text-danger'
    }

    return {
      value: Math.round(fearGreedValue),
      color,
      sub: t(`indicators.fearGreed.${statusKey}`)
    }
  }

  const priceStatus = getPriceStatus()
  const rsiStatus = getRSIStatus()
  const macdStatus = getMACDStatus()
  const bbStatus = getBBStatus()
  const volumeStatus = getVolumeStatus()
  const fearGreedStatus = getFearGreedStatus()

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {/* 1. PRICE */}
      <div className="bg-surface-300/60 border border-surface-400/30 p-2 rounded">
        <div className="text-[8px] text-surface-500 mb-0.5 uppercase tracking-wide">PRICE</div>
        <div className={`text-base font-bold leading-tight ${priceStatus.color}`}>
          {priceStatus.value}
        </div>
        <div className={`flex items-center gap-0.5 text-[9px] mt-0.5 ${priceStatus.color}`}>
          {priceStatus.icon}
          <span>{priceStatus.sub}</span>
        </div>
      </div>

      {/* 2. RSI */}
      <div className="bg-surface-300/60 border border-surface-400/30 p-2 rounded">
        <div className="text-[8px] text-surface-500 mb-0.5 uppercase tracking-wide">RSI (14)</div>
        <div className={`text-base font-bold leading-tight ${rsiStatus.color}`}>
          {rsiStatus.value}
        </div>
        <div className={`text-[9px] mt-0.5 ${rsiStatus.color}`}>
          {rsiStatus.sub}
        </div>
      </div>

      {/* 3. MACD */}
      <div className="bg-surface-300/60 border border-surface-400/30 p-2 rounded">
        <div className="text-[8px] text-surface-500 mb-0.5 uppercase tracking-wide">MACD</div>
        <div className={`text-base font-bold leading-tight ${macdStatus.color}`}>
          {macdStatus.value}
        </div>
        <div className={`text-[9px] mt-0.5 ${macdStatus.color}`}>
          {macdStatus.sub}
        </div>
      </div>

      {/* 4. BOLLINGER BANDS */}
      <div className="bg-surface-300/60 border border-surface-400/30 p-2 rounded">
        <div className="text-[8px] text-surface-500 mb-0.5 uppercase tracking-wide">BB WIDTH</div>
        <div className={`text-base font-bold leading-tight ${bbStatus.color}`}>
          {bbStatus.value}
        </div>
        <div className={`text-[9px] mt-0.5 ${bbStatus.color}`}>
          {bbStatus.sub}
        </div>
      </div>

      {/* 5. VOLUME */}
      <div className="bg-surface-300/60 border border-surface-400/30 p-2 rounded">
        <div className="text-[8px] text-surface-500 mb-0.5 uppercase tracking-wide">VOLUME</div>
        <div className={`text-base font-bold leading-tight ${volumeStatus.color}`}>
          {volumeStatus.value}
        </div>
        <div className={`text-[9px] mt-0.5 ${volumeStatus.color}`}>
          {volumeStatus.sub}
        </div>
      </div>

      {/* 6. FEAR & GREED */}
      <div className="bg-surface-300/60 border border-surface-400/30 p-2 rounded">
        <div className="text-[8px] text-surface-500 mb-0.5 uppercase tracking-wide">F&G</div>
        <div className={`text-base font-bold leading-tight ${fearGreedStatus.color}`}>
          {fearGreedStatus.value}
        </div>
        <div className={`text-[9px] mt-0.5 ${fearGreedStatus.color}`}>
          {fearGreedStatus.sub}
        </div>
      </div>
    </div>
  )
}

export default IndicatorCardsGrid
