import React, { useState, useEffect, useRef } from 'react'
import CurrentBar from './CurrentBar'
import FilterControlBar from './FilterControlBar'
import WhaleCanvas from './WhaleCanvas'
import MACDTooltip from './MACDTooltip'
import BubbleParticles from './BubbleParticles'
import WhaleVolumeGauge from './WhaleVolumeGauge'
import VolumeSpine from './VolumeSpine'
import { supabase } from '../utils/supabase'

// Timeframe durations in seconds
const TIMEFRAME_DURATIONS_SECONDS = {
  '1h': 3600,
  '4h': 14400,
  '1d': 86400
}

/**
 * MainVisualizationSet - Market Sentiment & Whale Visualization
 * Contains: CurrentBar + RSI Line + Bull/Bear Gradient + MACD Overlay + WhaleCanvas
 */
function MainVisualizationSet({
  timeframe,
  symbol,
  onSymbolChange,
  onTimeframeChange,
  isMuted,
  onMuteToggle,
  bullRatio,
  sentiment,
  whales,
  loading,
  error,
  onRetry,
  whaleCanvasRef
}) {
  // Container ref for measuring dimensions
  const containerRef = useRef(null)

  // Transition state for smooth whale fade
  const [isTransitioning, setIsTransitioning] = useState(false)

  // MACD hover state
  const [macdHovered, setMacdHovered] = useState(null) // 'buy', 'sell', or null
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Handle timeframe change with transition
  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 300)
    return () => clearTimeout(timer)
  }, [timeframe])

  return (
    <div className="w-full">
      {/* Filter Control Bar - Compact header above graph */}
      <FilterControlBar
        symbol={symbol}
        onSymbolChange={onSymbolChange}
        timeframe={timeframe}
        onTimeframeChange={onTimeframeChange}
        isMuted={isMuted}
        onMuteToggle={onMuteToggle}
      />

      {/* Error Boundary - Database Connection Error */}
      {error && (
        <div className="w-full bg-danger/10 border-2 border-danger rounded-lg p-6 mb-4 animate-pulse">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Error Icon */}
            <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-danger"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h3 className="text-xl font-bold text-danger">
              Database Connection Error
            </h3>

            {/* Error Message */}
            <div className="text-center max-w-md">
              <p className="text-surface-500 mb-2">
                Unable to connect to the database. This may be due to:
              </p>
              <ul className="text-sm text-surface-400 text-left list-disc list-inside space-y-1">
                <li>Missing environment variables</li>
                <li>Network connectivity issues</li>
                <li>Database service unavailable</li>
                <li>CORS configuration mismatch</li>
              </ul>
              {error.message && (
                <p className="mt-3 text-xs font-mono text-danger bg-danger/5 p-2 rounded border border-danger/20">
                  {error.message}
                </p>
              )}
            </div>

            {/* Retry Button */}
            <button
              onClick={() => {
                console.log('🔄 Retrying connection...')
                if (onRetry) {
                  onRetry()
                } else {
                  window.location.reload()
                }
              }}
              className="px-6 py-3 bg-danger hover:bg-danger/80 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Retry Connection
            </button>

            {/* Diagnostic Links */}
            <div className="flex space-x-4 text-sm text-surface-400">
              <a
                href="/api/diagnostic/test-db"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-info underline"
              >
                Run Diagnostics
              </a>
              <a
                href="/api/diagnostic/health"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-info underline"
              >
                Check Health
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Graph container with relative positioning */}
      <div className="relative w-full">
        {/* Current Bar Container */}
        <div
          ref={containerRef}
          className="relative w-full h-[400px]"
          onClick={(e) => {
            if (whaleCanvasRef.current) {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              whaleCanvasRef.current.handleClick(x, y)
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          {/* Current Bar - Price display only */}
          <CurrentBar sentiment={sentiment} />

          {/* Whale Canvas - Positioned above all overlays with pointer-events-none */}
          <WhaleCanvas
            ref={whaleCanvasRef}
            sentiment={sentiment}
            whales={whales || []}
            timeframe={timeframe}
            symbol={symbol}
            loading={loading}
            containerRef={containerRef}
            className={`absolute top-0 left-0 w-full h-full z-[70] pointer-events-none transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {/* RSI Center Line - Full height vertical line with white glow and 20px buffer zone */}
          <div
            className="absolute top-0 bottom-0 w-[40px] z-40 transition-all duration-500 pointer-events-none flex items-center justify-center"
            style={{
              left: `${sentiment.rsi_average ? (1.0 - (sentiment.rsi_average / 100)) * 100 : 50}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {/* Volume Spine - Attached to RSI line */}
            <VolumeSpine history={sentiment?.volumeHistory} />

            {/* RSI Line - White vertical line with glow */}
            <div
              className="h-full w-0.5 bg-white z-10 relative"
              style={{
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
              }}
            />
          </div>

          {/* RSI Label - Bottom aligned */}
          <div
            className="absolute bottom-2 transform -translate-x-1/2 z-50 bg-surface-200 border border-surface-300 px-1.5 py-0.5 rounded text-[10px] shadow-sm pointer-events-none"
            style={{
              left: `${sentiment.rsi_average ? (1.0 - (sentiment.rsi_average / 100)) * 100 : 50}%`
            }}
          >
            <span className="text-surface-500 font-mono mr-1">RSI</span>
            <span className={`font-bold ${
              sentiment.rsi_average <= 30 ? 'text-danger' :
              sentiment.rsi_average <= 40 ? 'text-warning' :
              sentiment.rsi_average <= 60 ? 'text-surface-500' :
              sentiment.rsi_average <= 70 ? 'text-info' :
              'text-success'
            }`}>
              {sentiment.rsi_average ? sentiment.rsi_average.toFixed(1) : '50.0'}
            </span>
          </div>

          {/* Bull/Bear Full Gradient Background */}
          <div
            className="absolute top-0 bottom-0 left-0 right-0 z-10 pointer-events-none transition-all duration-500"
            style={{
              background: `linear-gradient(to right,
                rgba(211, 72, 78, 0.5) 0%,
                rgba(211, 72, 78, 0.5) ${(1 - bullRatio) * 100}%,
                rgba(82, 175, 124, 0.5) ${(1 - bullRatio) * 100}%,
                rgba(82, 175, 124, 0.5) 100%)`
            }}
          />

          {/* Bubble Particles - Underwater ambient effect */}
          <BubbleParticles
            containerRef={containerRef}
            className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none"
          />

          {/* MACD Overlay - Buy (Right) - Full height */}
          {sentiment.macd_histogram > 0 && (
            <div
              className="absolute top-0 bottom-0 right-0 transition-all duration-300 pointer-events-auto z-[60] cursor-pointer"
              style={{
                width: `${(1.0 - (sentiment.rsi_average / 100)) * Math.min(1, Math.abs(sentiment.macd_histogram_raw) / 50) * 50}%`,
                backgroundColor: macdHovered === 'buy' ? 'rgba(97, 215, 151, 0.7)' : 'rgba(97, 215, 151, 0.5)',
                borderLeft: '1px solid rgba(97, 215, 151, 0.5)',
                boxShadow: macdHovered === 'buy' ? '0 0 20px rgba(97, 215, 151, 0.8)' : 'none',
                opacity: macdHovered === 'buy' ? 1 : 0.8
              }}
              onMouseEnter={() => setMacdHovered('buy')}
              onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setMacdHovered(null)}
            />
          )}

          {/* MACD Overlay - Sell (Left) - Full height */}
          {sentiment.macd_histogram < 0 && (
            <div
              className="absolute top-0 bottom-0 left-0 transition-all duration-300 pointer-events-auto z-[60] cursor-pointer"
              style={{
                width: `${(sentiment.rsi_average / 100) * Math.min(1, Math.abs(sentiment.macd_histogram_raw) / 50) * 50}%`,
                backgroundColor: macdHovered === 'sell' ? 'rgba(191, 52, 59, 0.7)' : 'rgba(191, 52, 59, 0.5)',
                borderRight: '1px solid rgba(191, 52, 59, 0.5)',
                boxShadow: macdHovered === 'sell' ? '0 0 20px rgba(191, 52, 59, 0.8)' : 'none',
                opacity: macdHovered === 'sell' ? 1 : 0.8
              }}
              onMouseEnter={() => setMacdHovered('sell')}
              onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setMacdHovered(null)}
            />
          )}
        </div>

        {/* Bottom Info Bar - 20px height slot for whale volume gauges */}
        <div className="w-full h-[20px] bg-surface-200 border-t border-surface-300">
          <WhaleVolumeGauge whales={whales} timeframe={timeframe} />
        </div>
      </div>

      {/* MACD Tooltip */}
      {macdHovered && (
        <MACDTooltip
          macdLine={sentiment.macd_line}
          macdSignal={sentiment.macd_signal}
          macdHistogram={sentiment.macd_histogram}
          macdCross={sentiment.macd_cross}
          position={tooltipPosition}
        />
      )}
    </div>
  )
}

export default MainVisualizationSet
