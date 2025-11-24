import React from 'react'
import { useMarketData } from '../hooks/useMarketData'

/**
 * IndicatorStatusPanel - Technical Indicator Status Display
 * Shows precise numerical values and state classifications for RSI, MACD, and Bollinger Bands
 *
 * @param {string} activeCoin - Active coin symbol ('통합', 'BTC', 'ETH', 'XRP')
 * @param {string} timeFilter - Active timeframe ('1h', '4h', '8h', '12h', '1d')
 */
function IndicatorStatusPanel({ activeCoin = '통합', timeFilter = '1h' }) {
  const marketData = useMarketData(timeFilter, activeCoin)

  // Calculate RSI status with 10-level classification
  const getRSIStatus = (rsi) => {
    if (rsi <= 10) return { text: 'Extreme Oversold (L1)', color: 'text-red-400' }
    if (rsi <= 20) return { text: 'Very Oversold (L2)', color: 'text-red-400' }
    if (rsi <= 30) return { text: 'Oversold (L3)', color: 'text-red-400' }
    if (rsi <= 40) return { text: 'Bearish (L4)', color: 'text-orange-400' }
    if (rsi <= 50) return { text: 'Neutral Low (L5)', color: 'text-gray-400' }
    if (rsi <= 60) return { text: 'Neutral High (L6)', color: 'text-gray-400' }
    if (rsi <= 70) return { text: 'Bullish (L7)', color: 'text-blue-400' }
    if (rsi <= 80) return { text: 'Overbought (L8)', color: 'text-green-400' }
    if (rsi <= 90) return { text: 'Very Overbought (L9)', color: 'text-green-400' }
    return { text: 'Extreme Overbought (L10)', color: 'text-green-400' }
  }

  // Calculate MACD trend
  const getMACDTrend = (histogram) => {
    if (histogram > 0) return { text: 'Bullish', color: 'text-green-400' }
    if (histogram < 0) return { text: 'Bearish', color: 'text-red-400' }
    return { text: 'Neutral', color: 'text-gray-400' }
  }

  // Calculate Bollinger position
  const getBBPosition = (price, bb_upper, bb_middle, bb_lower) => {
    const upperDist = Math.abs(price - bb_upper)
    const middleDist = Math.abs(price - bb_middle)
    const lowerDist = Math.abs(price - bb_lower)
    const minDist = Math.min(upperDist, middleDist, lowerDist)

    if (minDist === upperDist) return { text: 'Near Upper', color: 'text-red-400' }
    if (minDist === lowerDist) return { text: 'Near Lower', color: 'text-green-400' }
    return { text: 'Near Middle', color: 'text-gray-400' }
  }

  // Calculate price change percentage (mock - would need historical data)
  const priceChange = 0 // Placeholder
  const priceChangePercent = 0 // Placeholder

  const rsiStatus = getRSIStatus(marketData.rsi_average)
  const macdTrend = getMACDTrend(marketData.macd_histogram)
  const bbPosition = getBBPosition(
    marketData.currentPrice,
    marketData.bb_upper,
    marketData.bb_middle,
    marketData.bb_lower
  )
  const bandwidth = marketData.bb_upper - marketData.bb_lower

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Price Card */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-lg p-4">
        <div className="text-xs text-gray-500 mb-2">PRICE</div>
        <div className="text-2xl font-mono font-bold text-white mb-1">
          ${marketData.currentPrice.toFixed(2)}
        </div>
        <div className={`text-sm font-mono ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
        </div>
      </div>

      {/* RSI Card */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-lg p-4">
        <div className="text-xs text-gray-500 mb-2">RSI (14)</div>
        <div className={`text-2xl font-mono font-bold mb-1 ${rsiStatus.color}`}>
          {marketData.rsi_average.toFixed(1)}
        </div>
        <div className={`text-sm ${rsiStatus.color}`}>
          {rsiStatus.text}
        </div>
      </div>

      {/* MACD Card */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-lg p-4">
        <div className="text-xs text-gray-500 mb-2">MACD Histogram</div>
        <div className={`text-2xl font-mono font-bold mb-1 ${macdTrend.color}`}>
          {marketData.macd_histogram.toFixed(2)}
        </div>
        <div className={`text-sm ${macdTrend.color}`}>
          {macdTrend.text}
        </div>
      </div>

      {/* Bollinger Card */}
      <div className="bg-[#232323] border border-[#2E2E2E] rounded-lg p-4">
        <div className="text-xs text-gray-500 mb-2">Bollinger Bands</div>
        <div className={`text-lg font-mono font-bold mb-1 ${bbPosition.color}`}>
          {bbPosition.text}
        </div>
        <div className="text-sm text-gray-400 font-mono">
          Width: {bandwidth.toFixed(2)}
        </div>
      </div>
    </div>
  )
}

export default IndicatorStatusPanel
