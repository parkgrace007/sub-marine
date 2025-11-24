import React, { useMemo } from 'react'

/**
 * WhaleVolumeGauge - Segmented HP gauge bars for inflow/outflow whale volumes
 *
 * Features:
 * - 20 segments per side (digital style)
 * - Inflow side: right-aligned, fills left (green)
 * - Outflow side: left-aligned, fills right (red)
 * - Real-time weight calculation from whale amount_usd
 * - Smooth animations
 * - Timeframe-based scaling (time-proportional: 1h=$1B, 4h=$4B, 8h=$8B, 12h=$12B, 1d=$24B)
 */
function WhaleVolumeGauge({ whales = [], timeframe = '1h' }) {
  // Calculate volumes
  const { inflowVolume, outflowVolume, maxVolume } = useMemo(() => {
    const inflowWhales = whales.filter(w => w.flow_type === 'inflow')
    const outflowWhales = whales.filter(w => w.flow_type === 'outflow')

    const inflow = inflowWhales.reduce((sum, w) => sum + (w.amount_usd || 0), 0)
    const outflow = outflowWhales.reduce((sum, w) => sum + (w.amount_usd || 0), 0)

    // Timeframe-based fixed baseline (time-proportional: 1 hour = $1B)
    const baselineByTimeframe = {
      '1h': 1_000_000_000,     // $1,000M = $1B (1x)
      '4h': 4_000_000_000,     // $4,000M = $4B (4x)
      '8h': 8_000_000_000,     // $8,000M = $8B (8x)
      '12h': 12_000_000_000,   // $12,000M = $12B (12x)
      '1d': 24_000_000_000     // $24,000M = $24B (24x)
    }
    const max = baselineByTimeframe[timeframe] || 1_000_000_000

    return { inflowVolume: inflow, outflowVolume: outflow, maxVolume: max }
  }, [whales, timeframe])

  // Calculate filled segments (0-20)
  const inflowSegments = Math.min(20, Math.floor((inflowVolume / maxVolume) * 20))
  const outflowSegments = Math.min(20, Math.floor((outflowVolume / maxVolume) * 20))

  // Generate 20 segments
  const segments = Array.from({ length: 20 }, (_, i) => i)

  return (
    <div className="w-full h-full flex items-center justify-between px-2 sm:px-4 gap-2 sm:gap-4">
      {/* OUTFLOW side (left-aligned, fills right) */}
      <div className="flex-1 flex items-center gap-0.5 sm:gap-1">
        {segments.map((i) => (
          <div
            key={`outflow-${i}`}
            className={`flex-1 h-3 rounded-sm transition-all duration-300 ${
              i < outflowSegments
                ? 'bg-danger shadow-[0_0_4px_rgba(211,72,78,0.6)]'
                : 'bg-surface-400 opacity-30'
            }`}
            style={{
              minWidth: '4px'
            }}
          />
        ))}
        <span className="text-[10px] sm:text-xs font-mono text-danger ml-1 sm:ml-2 min-w-[40px] sm:min-w-[60px] text-right">
          ${(outflowVolume / 1_000_000).toFixed(1)}M
        </span>
      </div>

      {/* Center divider */}
      <div className="w-px h-3 bg-surface-300" />

      {/* INFLOW side (right-aligned, fills left) */}
      <div className="flex-1 flex items-center gap-0.5 sm:gap-1 flex-row-reverse">
        {segments.map((i) => (
          <div
            key={`inflow-${i}`}
            className={`flex-1 h-3 rounded-sm transition-all duration-300 ${
              i < inflowSegments
                ? 'bg-success shadow-[0_0_4px_rgba(82,175,124,0.6)]'
                : 'bg-surface-400 opacity-30'
            }`}
            style={{
              minWidth: '4px'
            }}
          />
        ))}
        <span className="text-[10px] sm:text-xs font-mono text-success mr-1 sm:mr-2 min-w-[40px] sm:min-w-[60px] text-left">
          ${(inflowVolume / 1_000_000).toFixed(1)}M
        </span>
      </div>
    </div>
  )
}

export default WhaleVolumeGauge
