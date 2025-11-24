import { supabase } from '../src/utils/supabase.js'

async function verifyMultiCoin() {
  console.log('🔍 Verifying Multi-Coin Database Records...\n')

  // Query latest records for 1h timeframe
  const { data, error } = await supabase
    .from('market_sentiment')
    .select('created_at, timeframe, symbol, rsi_average, bull_ratio, macd_line, bb_middle')
    .eq('timeframe', '1h')
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.error('❌ No records found')
    process.exit(1)
  }

  console.log(`📊 Total records fetched: ${data.length}`)
  console.table(data.map(r => ({
    time: new Date(r.created_at).toLocaleTimeString('en-US', { hour12: false }),
    timeframe: r.timeframe,
    symbol: r.symbol,
    RSI: r.rsi_average.toFixed(2),
    'Bull %': (r.bull_ratio * 100).toFixed(2),
    MACD: r.macd_line.toFixed(4),
    'BB Mid': r.bb_middle ? r.bb_middle.toFixed(2) : 'N/A'
  })))

  // Check if latest update has 4 symbols
  const latestTime = data[0].created_at
  const latestRecords = data.filter(r => r.created_at === latestTime)

  console.log(`\n✅ Latest update time: ${new Date(latestTime).toLocaleString()}`)
  console.log(`📦 Records for latest update: ${latestRecords.length}/4`)
  console.log(`🏷️  Symbols: ${latestRecords.map(r => r.symbol).sort().join(', ')}`)

  // Verify all 4 symbols exist
  const symbols = latestRecords.map(r => r.symbol).sort()
  const expectedSymbols = ['BTC', 'ETH', 'TOTAL', 'XRP']
  const hasAllSymbols = expectedSymbols.every(sym => symbols.includes(sym))

  if (hasAllSymbols && latestRecords.length === 4) {
    console.log('✅ SUCCESS: All 4 symbols (BTC/ETH/XRP/TOTAL) are present!\n')
  } else {
    console.log(`❌ MISSING SYMBOLS: Expected ${expectedSymbols.join(', ')} but got ${symbols.join(', ')}\n`)
  }

  // Verify TOTAL is average of BTC/ETH/XRP
  const btc = latestRecords.find(r => r.symbol === 'BTC')
  const eth = latestRecords.find(r => r.symbol === 'ETH')
  const xrp = latestRecords.find(r => r.symbol === 'XRP')
  const total = latestRecords.find(r => r.symbol === 'TOTAL')

  if (btc && eth && xrp && total) {
    const avgRSI = (btc.rsi_average + eth.rsi_average + xrp.rsi_average) / 3
    const rsiMatch = Math.abs(avgRSI - total.rsi_average) < 0.01

    console.log('🧮 Calculation Verification:')
    console.log(`   BTC RSI: ${btc.rsi_average.toFixed(2)}`)
    console.log(`   ETH RSI: ${eth.rsi_average.toFixed(2)}`)
    console.log(`   XRP RSI: ${xrp.rsi_average.toFixed(2)}`)
    console.log(`   Expected TOTAL: ${avgRSI.toFixed(2)}`)
    console.log(`   Actual TOTAL: ${total.rsi_average.toFixed(2)}`)
    console.log(`   Match: ${rsiMatch ? '✅' : '❌'}\n`)

    // Verify TOTAL BB uses BTC's BB
    const bbMatch = btc.bb_middle === total.bb_middle
    console.log('🎯 BB Verification (TOTAL should use BTC):')
    console.log(`   BTC BB Middle: ${btc.bb_middle ? btc.bb_middle.toFixed(2) : 'null'}`)
    console.log(`   TOTAL BB Middle: ${total.bb_middle ? total.bb_middle.toFixed(2) : 'null'}`)
    console.log(`   Match: ${bbMatch ? '✅' : '❌'}\n`)
  }

  process.exit(0)
}

verifyMultiCoin()
