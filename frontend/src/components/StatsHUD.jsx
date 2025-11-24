import React from 'react'

/**
 * StatsHUD - Enhanced statistics display widget
 * Shows SWSI, whale counts, and real-time metrics
 */
function StatsHUD({ sentiment, stats, timeframe }) {
  const formatNumber = (num) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num?.toFixed(0) || '0'
  }

  const bullRatio = sentiment.bull_ratio || 0.5
  const swsiScore = sentiment.swsi_score || 0

  // Determine market sentiment
  const getMarketSentiment = () => {
    if (bullRatio > 0.6) return { text: '강세', color: 'text-success' }
    if (bullRatio < 0.4) return { text: '약세', color: 'text-danger' }
    return { text: '중립', color: 'text-warning' }
  }

  const marketSentiment = getMarketSentiment()

  return (
    <div className="fixed top-20 left-2 sm:left-4 z-30 space-y-2 sm:space-y-3 select-none pointer-events-none max-w-[160px] sm:max-w-none">
      {/* SWSI Card */}
      <div className="bg-surface-200 border border-surface-300 rounded-md p-2 sm:p-4 shadow-lg min-w-[140px] sm:min-w-[200px]">
        <div className="text-[10px] sm:text-xs text-surface-500 mb-1 font-mono uppercase">SWSI</div>
        <div className="flex items-baseline gap-1 sm:gap-2">
          <div className={`text-xl sm:text-3xl font-bold ${marketSentiment.color}`}>
            {swsiScore.toFixed(3)}
          </div>
          <div className={`text-[10px] sm:text-sm font-semibold ${marketSentiment.color}`}>
            {marketSentiment.text}
          </div>
        </div>

        {/* Bull/Bear Ratio Bar */}
        <div className="mt-2 sm:mt-3 space-y-1">
          <div className="flex justify-between text-[10px] sm:text-xs text-surface-500">
            <span>BULL {(bullRatio * 100).toFixed(0)}%</span>
            <span>BEAR {((1 - bullRatio) * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-success to-primary transition-all duration-300"
              style={{ width: `${bullRatio * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Whale Stats Card */}
      <div className="bg-surface-200 border border-surface-300 rounded-md p-2 sm:p-4 shadow-lg min-w-[140px] sm:min-w-[200px]">
        <div className="text-[10px] sm:text-xs text-surface-500 mb-1 sm:mb-2 font-mono uppercase">Whales</div>

        <div className="space-y-1 sm:space-y-2">
          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] sm:text-sm text-surface-600 opacity-80">Total</span>
            <span className="text-sm sm:text-lg font-bold text-surface-600">{stats.total || 0}</span>
          </div>

          {/* Inflow */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] sm:text-sm text-surface-600 opacity-80">Inflow</span>
            <span className="text-sm sm:text-lg font-semibold text-success">{stats.inflow || 0}</span>
          </div>

          {/* Outflow */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] sm:text-sm text-surface-600 opacity-80">Outflow</span>
            <span className="text-sm sm:text-lg font-semibold text-danger">{stats.outflow || 0}</span>
          </div>

          {/* FPS */}
          <div className="flex justify-between items-center pt-1 sm:pt-2 border-t border-surface-300">
            <span className="text-[9px] sm:text-xs text-surface-500">FPS</span>
            <span className="text-[10px] sm:text-sm font-mono text-surface-600 opacity-80">{stats.fps || 0}</span>
          </div>
        </div>
      </div>

      {/* Volume Card - Hide on mobile */}
      {sentiment.total_volume_usd && (
        <div className="hidden sm:block bg-surface-200 border border-surface-300 rounded-md p-4 shadow-lg min-w-[200px]">
          <div className="text-xs text-surface-500 mb-2 font-mono uppercase">Volume ({timeframe})</div>

          <div className="space-y-2">
            {/* Total Volume */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-surface-600 opacity-80">Total</span>
              <span className="text-lg font-bold text-surface-600">
                ${formatNumber(sentiment.total_volume_usd)}
              </span>
            </div>

            {/* Inflow Volume */}
            {sentiment.inflow_volume_usd && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-600 opacity-80">Inflow</span>
                <span className="text-sm font-semibold text-success">
                  ${formatNumber(sentiment.inflow_volume_usd)}
                </span>
              </div>
            )}

            {/* Outflow Volume */}
            {sentiment.outflow_volume_usd && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-600 opacity-80">Outflow</span>
                <span className="text-sm font-semibold text-danger">
                  ${formatNumber(sentiment.outflow_volume_usd)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsHUD
