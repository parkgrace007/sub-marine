import React from 'react'
import { Globe } from 'lucide-react'
import CoinIcon from './CoinIcon'

/**
 * FilterControlBar - Combined filter and settings controls for main graph
 * Layout: Symbol Buttons → Timeframe Filter → Settings Buttons
 */
function FilterControlBar({
  symbol,
  onSymbolChange,
  timeframe,
  onTimeframeChange,
  isMuted,
  onMuteToggle
}) {
  const coins = [
    { value: '통합', label: 'ALL', isGlobal: true },
    { value: 'BTC', label: 'BTC' },
    { value: 'ETH', label: 'ETH' },
    { value: 'XRP', label: 'XRP' }
  ]

  const timeframes = ['1h', '4h', '8h', '12h', '1d']

  return (
    <div
      className="w-full flex flex-nowrap items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-surface-200 border-t-0 border-x-0 border-b border-surface-300 overflow-x-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Symbol Buttons */}
      <div className="flex items-center gap-0.5 border border-surface-300 rounded overflow-hidden p-0.5 bg-surface-200">
        {coins.map((coin) => (
          <button
            key={coin.value}
            onClick={() => onSymbolChange(coin.value)}
            className={`
              px-1.5 py-1 sm:px-2.5 sm:py-1.5 text-[10px] font-medium transition-all duration-200 rounded
              flex items-center gap-1 sm:gap-1.5
              ${symbol === coin.value
                ? 'bg-primary/20 text-primary shadow-sm border border-primary'
                : 'text-surface-500 hover:bg-surface-400 hover:text-surface-600 border border-transparent'
              }
            `}
            title={coin.label}
          >
            {coin.isGlobal ? (
              <>
                <Globe size={12} className="opacity-80 sm:hidden" />
                <Globe size={14} className="opacity-80 hidden sm:block" />
              </>
            ) : (
              <>
                <CoinIcon symbol={coin.value} size={12} className="sm:hidden" />
                <CoinIcon symbol={coin.value} size={16} className="hidden sm:block" />
              </>
            )}
            <span className="hidden sm:inline">{coin.label}</span>
          </button>
        ))}
      </div>

      {/* 2. Timeframe Filter */}
      <div className="flex items-center gap-0.5 border border-surface-300 rounded overflow-hidden p-0.5 bg-surface-200">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`
              px-1.5 py-1 sm:px-2.5 sm:py-1.5 text-[10px] font-medium transition-all duration-200 rounded
              ${timeframe === tf
                ? 'bg-primary/20 text-primary shadow-sm border border-primary'
                : 'text-surface-500 hover:bg-surface-400 hover:text-surface-600 border border-transparent'
              }
            `}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* 3. Settings Buttons */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Mute/Unmute */}
        <button
          onClick={onMuteToggle}
          className="p-1 sm:p-1.5 bg-surface-400 hover:bg-surface-400 border border-surface-300 hover:border-primary rounded text-surface-500 hover:text-surface-600 transition-all duration-200 text-sm"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  )
}

export default FilterControlBar
