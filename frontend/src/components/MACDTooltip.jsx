import React from 'react'

/**
 * MACDTooltip - MACD indicator tooltip
 * Shows MACD Line, Signal, Histogram, and Cross status near mouse cursor
 */
function MACDTooltip({ macdLine, macdSignal, macdHistogram, macdCross, position }) {
  // Determine histogram status and color
  const getHistogramStatus = () => {
    if (macdHistogram > 0) return { status: '상승세', color: 'text-green-600' }
    if (macdHistogram < 0) return { status: '하락세', color: 'text-red-600' }
    return { status: '중립', color: 'text-gray-600' }
  }

  // Determine cross status
  const getCrossStatus = () => {
    if (macdCross === 'golden') return { text: 'Golden Cross', color: 'text-green-600', icon: '/icons/inflow.png' }
    if (macdCross === 'death') return { text: 'Death Cross', color: 'text-red-600', icon: '/icons/outflow.png' }
    return null
  }

  const histogramStatus = getHistogramStatus()
  const crossStatus = getCrossStatus()

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y + 10}px`
      }}
    >
      {/* Compact tooltip */}
      <div className="bg-white border border-gray-300 rounded px-3 py-2 shadow-md text-sm min-w-[140px]">
        <div className="font-bold text-gray-900 mb-1">MACD</div>

        {/* MACD Values */}
        <div className="text-xs space-y-0.5">
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Line:</span>
            <span className="font-mono">{macdLine?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Signal:</span>
            <span className="font-mono">{macdSignal?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Hist:</span>
            <span className={`font-mono font-semibold ${histogramStatus.color}`}>
              {macdHistogram?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className={`text-xs font-semibold mt-1 ${histogramStatus.color}`}>
          {histogramStatus.status}
        </div>

        {/* Cross Status (if exists) */}
        {crossStatus && (
          <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${crossStatus.color}`}>
            <img src={crossStatus.icon} alt={crossStatus.text} className="w-3.5 h-3.5 object-contain" />
            {crossStatus.text}
          </div>
        )}
      </div>
    </div>
  )
}

export default MACDTooltip
