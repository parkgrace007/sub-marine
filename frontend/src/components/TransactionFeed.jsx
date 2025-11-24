import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useWhaleData } from '../hooks/useWhaleData'
import TransactionRow from './TransactionRow'

/**
 * StatItem - Small stat display component
 */
function StatItem({ label, value, prefix = '', color = 'text-surface-600' }) {
  return (
    <div className="px-3 py-2 text-center">
      <div className="text-[9px] text-surface-500 font-mono uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-xs font-bold font-mono ${color}`}>
        {prefix}{value}
      </div>
    </div>
  )
}

/**
 * TransactionFeed - Live transaction feed at bottom of screen
 */
function TransactionFeed({ timeframe, onTransactionsChange }) {
  const [isPaused, setIsPaused] = useState(false)
  const [filter, setFilter] = useState('all')
  const { whales: transactions, loading, error } = useWhaleData(timeframe)
  const scrollRef = useRef(null)
  const prevTransactionCountRef = useRef(0)

  // Manual clear function (filters out existing data)
  const [clearedAt, setClearedAt] = useState(null)
  const clearTransactions = () => {
    setClearedAt(Date.now())
  }

  // Filter out transactions that were cleared
  const activeTransactions = useMemo(() => {
    if (!clearedAt) return transactions
    return transactions.filter(tx => (tx.timestamp * 1000) > clearedAt)
  }, [transactions, clearedAt])

  // Auto-scroll to top when new transaction arrives (if not paused)
  useEffect(() => {
    if (activeTransactions.length > prevTransactionCountRef.current && !isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    prevTransactionCountRef.current = activeTransactions.length
  }, [activeTransactions, isPaused])

  // Notify parent component of transactions change
  useEffect(() => {
    if (onTransactionsChange) {
      onTransactionsChange(activeTransactions)
    }
  }, [activeTransactions, onTransactionsChange])

  // Filter transactions (2025-11-23: Renamed flow types - inflow/outflow instead of buy/sell)
  const filteredTransactions = activeTransactions.filter((tx) => {
    if (filter === 'all') return true
    if (filter === 'inflow') return tx.flow_type === 'inflow'
    if (filter === 'outflow') return tx.flow_type === 'outflow'
    if (filter === 'special') return ['mint', 'burn'].includes(tx.transaction_type)
    if (filter === 'defi') return tx.flow_type === 'defi'
    if (filter === 'exchange') return tx.flow_type === 'exchange'
    return true
  })

  // Get filter statistics (2025-11-23: Renamed flow types - inflow/outflow)
  const stats = {
    all: activeTransactions.length,
    inflow: activeTransactions.filter(tx => tx.flow_type === 'inflow').length,
    outflow: activeTransactions.filter(tx => tx.flow_type === 'outflow').length,
    special: activeTransactions.filter(tx => ['mint', 'burn'].includes(tx.transaction_type)).length,
    defi: activeTransactions.filter(tx => tx.flow_type === 'defi').length,
    exchange: activeTransactions.filter(tx => tx.flow_type === 'exchange').length,
    // Placeholder for new stats, assuming they will be calculated or passed
    volume24h: '1.2M', // Example value
    largeWhales: '12', // Example value
    netFlow: '250K' // Example value
  }

  // Assuming isConnected and processedCount are defined elsewhere or will be added
  const isConnected = !loading && !error; // Example logic
  const processedCount = activeTransactions.length; // Example logic

  return (
    <div className="flex flex-col h-full bg-surface-200 border border-surface-300 rounded-md overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-300 bg-surface-200/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
          <h2 className="font-display font-bold text-surface-600 tracking-wide text-sm">LIVE TRANSACTIONS</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-surface-500 font-mono">
            <span>{processedCount.toLocaleString()}</span>
            <span className="text-[10px] opacity-70">TXS</span>
          </div>
          <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${isConnected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 divide-x divide-surface-300 border-b border-surface-300 bg-surface-100/50">
        <StatItem label="VOL (24h)" value={stats.volume24h} prefix="$" />
        <StatItem label="LG WHALES" value={stats.largeWhales} />
        <StatItem label="NET FLOW" value={stats.netFlow} prefix="$" color={stats.netFlow > 0 ? 'text-success' : stats.netFlow < 0 ? 'text-danger' : 'text-surface-500'} />
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-1 p-2 border-b border-surface-300 bg-surface-100">
        {[
          { key: 'all', label: 'All', icon: '🌐', isImage: false },
          { key: 'inflow', label: 'Inflow', icon: '/icons/inflow.png', isImage: true },
          { key: 'outflow', label: 'Outflow', icon: '/icons/outflow.png', isImage: true },
          { key: 'special', label: 'Special', icon: '/icons/mint.png', isImage: true },
          { key: 'defi', label: 'DeFi', icon: '🌐', isImage: false },
          { key: 'exchange', label: 'Exch', icon: '/icons/transfer.png', isImage: true }
        ].map(({ key, label, icon, isImage }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`
                  px-2 py-1 text-xs transition-all duration-200 border rounded-sm flex items-center gap-1
                  ${filter === key
                ? 'bg-brand/20 text-brand border-brand/50'
                : 'bg-surface-300 text-surface-600 border-surface-400 hover:bg-surface-400'
              }
                `}
            title={`${label} (${stats[key]})`}
          >
            {isImage ? (
              <img src={icon} alt={label} className="w-3.5 h-3.5 object-contain" />
            ) : (
              <span>{icon}</span>
            )}
            {stats[key]}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div
        ref={scrollRef}
        className="overflow-y-auto h-[calc(100%-52px)] px-4 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
      >
        {error && (
          <div className="bg-danger/10 border border-danger/50 px-4 py-3 text-sm text-danger rounded-sm">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        {filteredTransactions.length === 0 && !loading && (
          <div className="text-center text-mist opacity-40 py-8">
            <div className="text-4xl mb-2 animate-bounce">🌊</div>
            <div className="text-sm font-display">No transactions yet</div>
            <div className="text-xs mt-1 font-mono">Waiting for whale activity...</div>
          </div>
        )}

        {filteredTransactions.map((tx, index) => (
          <TransactionRow
            key={tx.id}
            transaction={tx}
            isNew={index === 0 && !isPaused}
          />
        ))}
      </div>
    </div>
  )
}

export default TransactionFeed
