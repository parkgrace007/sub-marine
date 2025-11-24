import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// Simulate exactly what useWhaleData.js does
async function testFrontendQuery() {
  console.log('\n' + '='.repeat(70))
  console.log('🧪 SIMULATING FRONTEND useWhaleData HOOK')
  console.log('='.repeat(70) + '\n')

  const timeframe = '8h'
  const symbol = 'BTC'  // Default on MainPage.jsx
  const flowTypes = ['inflow', 'outflow']  // (2025-11-23: renamed flow types)

  // Calculate timeframe window (exactly like useWhaleData.js)
  const TIMEFRAME_DURATIONS_MS = {
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '8h': 8 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  }

  const BUFFER_MULTIPLIER = 2
  const MIN_WHALE_USD = 10_000_000

  const timeframeDuration = TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['1h']
  const fetchWindow = timeframeDuration * BUFFER_MULTIPLIER
  const cutoffTimestamp = Math.floor((Date.now() - fetchWindow) / 1000)

  console.log('📊 Query Parameters:')
  console.log(`   Timeframe: ${timeframe}`)
  console.log(`   Symbol: ${symbol}`)
  console.log(`   Flow Types: ${flowTypes.join(', ')}`)
  console.log(`   Fetch Window: ${fetchWindow / 1000 / 60 / 60}h`)
  console.log(`   Cutoff Timestamp: ${new Date(cutoffTimestamp * 1000).toLocaleString()}`)
  console.log(`   Min USD: $${MIN_WHALE_USD.toLocaleString()}`)

  // Build query exactly like useWhaleData.js
  let query = supabase
    .from('whale_events')
    .select('*')
    .gte('timestamp', cutoffTimestamp)
    .gte('amount_usd', MIN_WHALE_USD)

  // Add symbol filter only if not '통합' (ALL)
  if (symbol !== '통합') {
    query = query.eq('symbol', symbol.toUpperCase())  // THIS IS THE FIX
    console.log(`\n🔍 Adding symbol filter: symbol = '${symbol.toUpperCase()}'`)
  }

  const { data, error } = await query
    .order('timestamp', { ascending: false })
    .limit(200)

  if (error) {
    console.error('\n❌ Error fetching whales:', error)
    process.exit(1)
  }

  console.log(`\n✅ Fetched ${data.length} whales from database\n`)

  // Client-side filtering (exactly like useWhaleData.js useMemo)
  const now = Date.now()
  const cutoff = now - TIMEFRAME_DURATIONS_MS[timeframe]

  const filtered = data.filter((whale) => {
    const whaleTime = whale.timestamp * 1000
    const timeMatch = whaleTime >= cutoff

    // Filter by flow_type (inflow/outflow only for dashboard) (2025-11-23: renamed flow types)
    const flowMatch = flowTypes.includes(whale.flow_type)

    return timeMatch && flowMatch
  })

  console.log('🎯 After client-side filtering:')
  console.log(`   Total whales: ${filtered.length}`)
  console.log(`   Time window: last ${timeframe} (${new Date(cutoff).toLocaleString()} to now)`)
  console.log(`   Flow types: ${flowTypes.join(', ')}\n`)

  // Show sample whales
  console.log('📋 Sample whales (first 5):')
  filtered.slice(0, 5).forEach((whale, i) => {
    const date = new Date(whale.timestamp * 1000)
    const amount = (whale.amount_usd / 1e6).toFixed(1)
    const hoursAgo = ((Date.now() - whale.timestamp * 1000) / (1000 * 60 * 60)).toFixed(1)
    console.log(`   ${i + 1}. [${whale.flow_type.toUpperCase()}] ${whale.symbol} $${amount}M - ${hoursAgo}h ago - ${date.toLocaleString()}`)
  })

  // Flow type distribution
  console.log('\n📊 Flow type distribution:')
  const flowCounts = {}
  filtered.forEach(whale => {
    flowCounts[whale.flow_type] = (flowCounts[whale.flow_type] || 0) + 1
  })
  Object.entries(flowCounts).forEach(([flow, count]) => {
    console.log(`   ${flow}: ${count} whales`)
  })

  console.log('\n' + '='.repeat(70))
  console.log('✅ FRONTEND SIMULATION COMPLETE')
  console.log('='.repeat(70))
  console.log(`\n🎯 MainPage should display ${filtered.length} BTC buy/sell whales`)
  console.log(`   with timeframe=${timeframe}, symbol=${symbol}\n`)

  process.exit(0)
}

testFrontendQuery()
