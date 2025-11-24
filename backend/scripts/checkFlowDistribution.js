import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// Check flow_type distribution across all whales
async function checkFlowDistribution() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 FLOW TYPE DISTRIBUTION ANALYSIS')
  console.log('='.repeat(70) + '\n')

  const timeframe = '8h'
  const symbol = 'BTC'

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
  console.log(`   Flow Types: ALL (no filter)`)
  console.log(`   Cutoff Timestamp: ${new Date(cutoffTimestamp * 1000).toLocaleString()}`)
  console.log(`   Min USD: $${MIN_WHALE_USD.toLocaleString()}`)

  // Fetch ALL whales (no flow_type filter)
  let query = supabase
    .from('whale_events')
    .select('*')
    .gte('timestamp', cutoffTimestamp)
    .gte('amount_usd', MIN_WHALE_USD)

  if (symbol !== '통합') {
    query = query.eq('symbol', symbol.toUpperCase())
  }

  const { data, error } = await query
    .order('timestamp', { ascending: false })
    .limit(500)

  if (error) {
    console.error('\n❌ Error fetching whales:', error)
    process.exit(1)
  }

  console.log(`\n✅ Fetched ${data.length} whales from database (ALL flow types)\n`)

  // Client-side filtering by time only
  const now = Date.now()
  const cutoff = now - TIMEFRAME_DURATIONS_MS[timeframe]

  const filtered = data.filter((whale) => {
    const whaleTime = whale.timestamp * 1000
    return whaleTime >= cutoff
  })

  console.log('📊 FLOW TYPE DISTRIBUTION (ALL):')
  console.log('─'.repeat(70))

  const flowCounts = {}
  const flowTotalUSD = {}

  filtered.forEach(whale => {
    const type = whale.flow_type || 'unknown'
    flowCounts[type] = (flowCounts[type] || 0) + 1
    flowTotalUSD[type] = (flowTotalUSD[type] || 0) + whale.amount_usd
  })

  // Sort by count
  const sortedFlows = Object.entries(flowCounts).sort((a, b) => b[1] - a[1])

  console.log('\nBy count:')
  sortedFlows.forEach(([flow, count]) => {
    const percentage = ((count / filtered.length) * 100).toFixed(1)
    const totalUSD = (flowTotalUSD[flow] / 1e6).toFixed(0)
    console.log(`   ${flow.padEnd(12)} : ${count.toString().padStart(4)} whales (${percentage}%) - $${totalUSD}M total`)
  })

  console.log('\n📊 COMPARISON:')
  console.log('─'.repeat(70))

  const inflowOutflowCount = (flowCounts['inflow'] || 0) + (flowCounts['outflow'] || 0)
  const allCount = filtered.length
  const difference = allCount - inflowOutflowCount

  console.log(`   Total whales (ALL types): ${allCount}`)
  console.log(`   Inflow + Outflow only: ${inflowOutflowCount}`)
  console.log(`   Excluded by filter: ${difference} (${((difference / allCount) * 100).toFixed(1)}%)`)

  console.log('\n📋 Sample whales from EACH type (first 2):')
  console.log('─'.repeat(70))

  sortedFlows.forEach(([flowType]) => {
    console.log(`\n${flowType.toUpperCase()}:`)
    const samples = filtered.filter(w => w.flow_type === flowType).slice(0, 2)
    samples.forEach((whale, i) => {
      const date = new Date(whale.timestamp * 1000)
      const amount = (whale.amount_usd / 1e6).toFixed(1)
      const hoursAgo = ((Date.now() - whale.timestamp * 1000) / (1000 * 60 * 60)).toFixed(1)
      console.log(`   ${i + 1}. ${whale.symbol} $${amount}M - ${hoursAgo}h ago`)
      console.log(`      ${whale.from_owner_type} → ${whale.to_owner_type}`)
    })
  })

  console.log('\n' + '='.repeat(70))
  console.log('✅ ANALYSIS COMPLETE')
  console.log('='.repeat(70))
  console.log(`\n💡 RECOMMENDATION:`)
  console.log(`   Current filter shows: ${inflowOutflowCount} whales`)
  console.log(`   All types would show: ${allCount} whales`)
  console.log(`   Additional data available: ${difference} whales (+${((difference / inflowOutflowCount) * 100).toFixed(0)}%)\n`)

  process.exit(0)
}

checkFlowDistribution()
