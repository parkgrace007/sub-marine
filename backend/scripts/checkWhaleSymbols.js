import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function checkWhaleSymbols() {
  console.log('\n🔍 Checking whale_events database...\n')

  // Check recent whales (all symbols)
  const { data: allWhales, error } = await supabase
    .from('whale_events')
    .select('id, symbol, timestamp, amount_usd, flow_type')
    .gte('amount_usd', 10000000)
    .order('timestamp', { ascending: false })
    .limit(50)

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  console.log(`📊 Total whales ($10M+): ${allWhales.length}`)

  // Count by symbol
  const symbolCounts = {}
  allWhales.forEach(whale => {
    symbolCounts[whale.symbol] = (symbolCounts[whale.symbol] || 0) + 1
  })

  console.log('\n📈 Symbol distribution:')
  Object.entries(symbolCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([symbol, count]) => {
      console.log(`   ${symbol.toUpperCase().padEnd(6)} : ${count} whales`)
    })

  // Show recent whales
  console.log('\n🐋 Recent 10 whales:')
  allWhales.slice(0, 10).forEach(whale => {
    const date = new Date(whale.timestamp * 1000)
    const amount = (whale.amount_usd / 1e6).toFixed(1)
    console.log(`   [${whale.symbol.toUpperCase()}] $${amount}M - ${whale.flow_type.padEnd(8)} - ${date.toLocaleString()}`)
  })

  // Check BTC specifically
  const { data: btcWhales, error: btcError } = await supabase
    .from('whale_events')
    .select('*')
    .eq('symbol', 'btc')
    .gte('amount_usd', 10000000)
    .order('timestamp', { ascending: false })
    .limit(10)

  console.log(`\n🔎 BTC whales (symbol='btc'): ${btcWhales?.length || 0}`)

  if (btcWhales && btcWhales.length > 0) {
    console.log('\n   Recent BTC whales:')
    btcWhales.forEach(whale => {
      const date = new Date(whale.timestamp * 1000)
      const amount = (whale.amount_usd / 1e6).toFixed(1)
      const hoursAgo = ((Date.now() - whale.timestamp * 1000) / (1000 * 60 * 60)).toFixed(1)
      console.log(`   $${amount}M - ${whale.flow_type.padEnd(8)} - ${hoursAgo}h ago - ${date.toLocaleString()}`)
    })
  }

  // Check timeframe window (8h)
  const now = Date.now()
  const eightHoursAgo = Math.floor((now - 8 * 60 * 60 * 1000) / 1000)

  const { data: recent8hBTC, error: recent8hError } = await supabase
    .from('whale_events')
    .select('*')
    .eq('symbol', 'btc')
    .gte('amount_usd', 10000000)
    .gte('timestamp', eightHoursAgo)
    .order('timestamp', { ascending: false })

  console.log(`\n⏰ BTC whales in last 8 hours: ${recent8hBTC?.length || 0}`)

  process.exit(0)
}

checkWhaleSymbols()
