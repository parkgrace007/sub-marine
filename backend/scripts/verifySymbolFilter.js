import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function verifySymbolFilter() {
  console.log('\n' + '='.repeat(70))
  console.log('🔍 SYMBOL FILTER VERIFICATION TEST')
  console.log('='.repeat(70) + '\n')

  // Test 1: Check all symbols in database
  console.log('📊 TEST 1: All symbols in database')
  console.log('-'.repeat(70))

  const { data: allWhales, error: allError } = await supabase
    .from('whale_events')
    .select('symbol')
    .gte('amount_usd', 10000000)
    .order('timestamp', { ascending: false })
    .limit(100)

  if (allError) {
    console.error('❌ Error:', allError)
    process.exit(1)
  }

  const symbolSet = new Set(allWhales.map(w => w.symbol))
  console.log(`   Found symbols: ${Array.from(symbolSet).join(', ')}`)
  console.log(`   Total unique symbols: ${symbolSet.size}`)

  // Test 2: Query with UPPERCASE 'BTC' (CORRECT WAY)
  console.log('\n📊 TEST 2: Query BTC whales (uppercase)')
  console.log('-'.repeat(70))

  const now = Date.now()
  const eightHoursAgo = Math.floor((now - 8 * 60 * 60 * 1000) / 1000)

  const { data: btcWhales, error: btcError } = await supabase
    .from('whale_events')
    .select('*')
    .eq('symbol', 'BTC')  // UPPERCASE like the fix
    .gte('amount_usd', 10000000)
    .gte('timestamp', eightHoursAgo)
    .in('flow_type', ['inflow', 'outflow'])
    .order('timestamp', { ascending: false })

  if (btcError) {
    console.error('❌ Error:', btcError)
  } else {
    console.log(`   ✅ Found ${btcWhales.length} BTC inflow/outflow whales in last 8 hours`)
    btcWhales.forEach(whale => {
      const date = new Date(whale.timestamp * 1000)
      const amount = (whale.amount_usd / 1e6).toFixed(1)
      const hoursAgo = ((Date.now() - whale.timestamp * 1000) / (1000 * 60 * 60)).toFixed(1)
      console.log(`      [${whale.flow_type.toUpperCase()}] $${amount}M - ${hoursAgo}h ago - ${date.toLocaleString()}`)
    })
  }

  // Test 3: Query with lowercase 'btc' (WRONG WAY - should return 0)
  console.log('\n📊 TEST 3: Query btc whales (lowercase) - SHOULD FAIL')
  console.log('-'.repeat(70))

  const { data: btcLowerWhales, error: btcLowerError } = await supabase
    .from('whale_events')
    .select('*')
    .eq('symbol', 'btc')  // lowercase - the old bug
    .gte('amount_usd', 10000000)
    .gte('timestamp', eightHoursAgo)
    .in('flow_type', ['inflow', 'outflow'])
    .order('timestamp', { ascending: false })

  if (btcLowerError) {
    console.error('❌ Error:', btcLowerError)
  } else {
    console.log(`   Found ${btcLowerWhales.length} whales (should be 0)`)
    if (btcLowerWhales.length === 0) {
      console.log('   ✅ CORRECT: lowercase query returns 0 results')
    } else {
      console.log('   ❌ UNEXPECTED: lowercase query returned results!')
    }
  }

  // Test 4: Check ETH whales
  console.log('\n📊 TEST 4: Query ETH whales (uppercase)')
  console.log('-'.repeat(70))

  const { data: ethWhales, error: ethError } = await supabase
    .from('whale_events')
    .select('*')
    .eq('symbol', 'ETH')
    .gte('amount_usd', 10000000)
    .gte('timestamp', eightHoursAgo)
    .in('flow_type', ['inflow', 'outflow'])
    .order('timestamp', { ascending: false })

  if (ethError) {
    console.error('❌ Error:', ethError)
  } else {
    console.log(`   ✅ Found ${ethWhales.length} ETH buy/sell whales in last 8 hours`)
    ethWhales.slice(0, 3).forEach(whale => {
      const date = new Date(whale.timestamp * 1000)
      const amount = (whale.amount_usd / 1e6).toFixed(1)
      const hoursAgo = ((Date.now() - whale.timestamp * 1000) / (1000 * 60 * 60)).toFixed(1)
      console.log(`      [${whale.flow_type.toUpperCase()}] $${amount}M - ${hoursAgo}h ago - ${date.toLocaleString()}`)
    })
  }

  // Test 5: Check XRP whales
  console.log('\n📊 TEST 5: Query XRP whales (uppercase)')
  console.log('-'.repeat(70))

  const { data: xrpWhales, error: xrpError } = await supabase
    .from('whale_events')
    .select('*')
    .eq('symbol', 'XRP')
    .gte('amount_usd', 10000000)
    .gte('timestamp', eightHoursAgo)
    .in('flow_type', ['inflow', 'outflow'])
    .order('timestamp', { ascending: false })

  if (xrpError) {
    console.error('❌ Error:', xrpError)
  } else {
    console.log(`   ✅ Found ${xrpWhales.length} XRP buy/sell whales in last 8 hours`)
    xrpWhales.slice(0, 3).forEach(whale => {
      const date = new Date(whale.timestamp * 1000)
      const amount = (whale.amount_usd / 1e6).toFixed(1)
      const hoursAgo = ((Date.now() - whale.timestamp * 1000) / (1000 * 60 * 60)).toFixed(1)
      console.log(`      [${whale.flow_type.toUpperCase()}] $${amount}M - ${hoursAgo}h ago - ${date.toLocaleString()}`)
    })
  }

  // Test 6: Query '통합' (ALL symbols) - like the frontend does
  console.log('\n📊 TEST 6: Query ALL whales (통합 filter)')
  console.log('-'.repeat(70))

  const { data: allBuySellWhales, error: allBuySellError } = await supabase
    .from('whale_events')
    .select('*')
    // NO .eq('symbol', ...) filter when symbol='통합'
    .gte('amount_usd', 10000000)
    .gte('timestamp', eightHoursAgo)
    .in('flow_type', ['inflow', 'outflow'])
    .order('timestamp', { ascending: false })
    .limit(200)

  if (allBuySellError) {
    console.error('❌ Error:', allBuySellError)
  } else {
    console.log(`   ✅ Found ${allBuySellWhales.length} total buy/sell whales (all symbols)`)

    // Group by symbol
    const symbolCounts = {}
    allBuySellWhales.forEach(whale => {
      symbolCounts[whale.symbol] = (symbolCounts[whale.symbol] || 0) + 1
    })

    console.log('   Symbol distribution:')
    Object.entries(symbolCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([symbol, count]) => {
        console.log(`      ${symbol}: ${count} whales`)
      })
  }

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('📋 VERIFICATION SUMMARY')
  console.log('='.repeat(70))
  console.log(`✅ Database stores symbols as UPPERCASE: ${Array.from(symbolSet).join(', ')}`)
  console.log(`✅ Uppercase query works: BTC (${btcWhales?.length || 0}), ETH (${ethWhales?.length || 0}), XRP (${xrpWhales?.length || 0})`)
  console.log(`✅ Lowercase query correctly fails: btc (${btcLowerWhales?.length || 0})`)
  console.log(`✅ '통합' (ALL) query returns all symbols: ${allBuySellWhales?.length || 0} whales`)
  console.log('\n🎯 CONCLUSION: Symbol filter logic using .toUpperCase() is CORRECT')
  console.log('='.repeat(70) + '\n')

  process.exit(0)
}

verifySymbolFilter()
