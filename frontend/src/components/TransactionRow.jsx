import React from 'react'
import CoinIcon from './CoinIcon'

/**
 * TransactionRow - Individual transaction display with animations
 */
function TransactionRow({ transaction, isNew = false }) {
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  // Format amount
  const formatAmount = (amount) => {
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M`
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(2)}K`
    return amount?.toFixed(2) || '0'
  }

  // Get icon and color based on transaction type
  const getTransactionStyle = () => {
    const type = transaction.transaction_type
    const flow = transaction.flow_type

    // Priority: transaction_type > flow_type
    if (type === 'mint') {
      return {
        icon: '/icons/mint.png',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/30',
        label: 'MINT'
      }
    }

    if (type === 'burn') {
      return {
        icon: '/icons/burn.png',
        color: 'text-secondary',
        bgColor: 'bg-secondary/10',
        borderColor: 'border-secondary/30',
        label: 'BURN'
      }
    }

    if (flow === 'inflow') {
      return {
        icon: '/icons/inflow.png',
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/30',
        label: 'INFLOW'
      }
    }

    if (flow === 'outflow') {
      return {
        icon: '/icons/outflow.png',
        color: 'text-danger',
        bgColor: 'bg-danger/10',
        borderColor: 'border-danger/30',
        label: 'OUTFLOW'
      }
    }

    if (flow === 'defi') {
      return {
        icon: '🌐',
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/30',
        label: 'DeFi'
      }
    }

    if (flow === 'exchange') {
      return {
        icon: '/icons/transfer.png',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/30',
        label: 'EXCH'
      }
    }

    if (flow === 'internal') {
      return {
        icon: '⚪',
        color: 'text-mist',
        bgColor: 'bg-primary/5',
        borderColor: 'border-primary/10',
        label: 'INTL'
      }
    }

    // Default
    return {
      icon: '⚫',
      color: 'text-mist',
      bgColor: 'bg-primary/5',
      borderColor: 'border-primary/10',
      label: 'UNKNOWN'
    }
  }

  // Get transaction label
  const getTransactionLabel = () => {
    const type = transaction.transaction_type
    const flow = transaction.flow_type
    const symbol = transaction.symbol?.toUpperCase() || ''
    const amount = formatAmount(transaction.amount)

    if (type === 'mint') {
      return `Minted ${amount} ${symbol}`
    }

    if (type === 'burn') {
      return `Burned ${amount} ${symbol}`
    }

    // Default: show amount + symbol + from → to
    const from = transaction.from_owner || 'Unknown wallet'
    const to = transaction.to_owner || 'Unknown wallet'
    return `${amount} ${symbol} • ${from} → ${to}`
  }

  const style = getTransactionStyle()

  return (
    <div
      className={`
        group relative flex items-center justify-between gap-4
        px-4 py-3 rounded-sm border transition-all duration-300
        ${style.bgColor} ${style.borderColor}
        ${isNew ? 'animate-slide-in-fade' : 'hover:scale-[1.01]'}
        hover:shadow-amber-500/20 hover:shadow-lg hover:border-opacity-60 hover:bg-surface-300
        h-16 min-h-[64px] max-h-[64px]
      `}
    >
      {/* Left section: Icon + Time + Label - Fixed Layout */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Type Icon - Fixed width */}
        <div className="flex-shrink-0 w-8 flex items-center justify-center">
          {style.icon.startsWith('/icons/') ? (
            <img src={style.icon} alt="icon" className="w-7 h-7 object-contain" />
          ) : (
            <span className="text-2xl">{style.icon}</span>
          )}
        </div>

        {/* Coin Icon - Fixed width */}
        <div className="flex-shrink-0 w-8 flex items-center justify-center">
          <CoinIcon symbol={transaction.symbol} size={28} />
        </div>

        {/* Time - Fixed width */}
        <span className="text-surface-500 font-mono text-xs flex-shrink-0 w-20">
          {formatTime(transaction.timestamp)}
        </span>

        {/* Transaction Label - Flex grow */}
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <span className="text-surface-600 text-sm font-medium truncate leading-tight mb-1 font-display tracking-wide">
            {getTransactionLabel()}
          </span>
          <div className="flex items-center gap-2 text-xs text-surface-500">
            <span className={`font-bold ${style.color} uppercase tracking-wide`}>{style.label}</span>
            <span>•</span>
            <span className="truncate">{transaction.blockchain}</span>
          </div>
        </div>
      </div>

      {/* Right section: Amount - Fixed width */}
      <div className="flex items-center justify-end flex-shrink-0 w-32">
        <span className={`text-base font-bold ${style.color} tabular-nums font-mono`}>
          ${formatAmount(transaction.amount_usd)}
        </span>
      </div>

      {/* Hover glow effect */}
      <div
        className={`
          absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100
          transition-opacity duration-300 pointer-events-none blur-xl
          ${style.bgColor}
        `}
      />
    </div>
  )
}

export default TransactionRow
