import React, { useState } from 'react'
import Header from '../components/Header'
import TransactionFeed from '../components/TransactionFeed'

/**
 * WhaleAlertsPage - Live Whale Transaction Feed
 * Displays real-time whale transactions with filtering and timeline controls
 */
function WhaleAlertsPage() {
  const [timeframe, setTimeframe] = useState('1h')

  return (
    <div className="min-h-screen bg-surface-100 text-surface-600 relative">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-6">
        <div className="h-[calc(100vh-120px)]">
          <TransactionFeed
            timeframe={timeframe}
            flowTypes={['inflow', 'outflow', 'exchange', 'defi']}
          />
        </div>
      </main>
    </div>
  )
}

export default WhaleAlertsPage
