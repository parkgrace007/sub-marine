import { supabase } from '../src/utils/supabase.js'

async function verifyTotalCalculation() {
  console.log('🧮 Verifying TOTAL Calculation Accuracy...\n')

  // Find the most recent update with all 4 symbols
  const { data: allRecords, error } = await supabase
    .from('market_sentiment')
    .select('created_at, timeframe, symbol, rsi_average, bull_ratio, macd_line, macd_signal, macd_histogram, bb_middle')
    .eq('timeframe', '1h')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  // Group by created_at and find first set with 4 records
  const grouped = {}
  allRecords.forEach(r => {
    if (!grouped[r.created_at]) grouped[r.created_at] = []
    grouped[r.created_at].push(r)
  })

  let fullSet = null
  for (const timestamp in grouped) {
    if (grouped[timestamp].length === 4) {
      fullSet = grouped[timestamp]
      break
    }
  }

  if (!fullSet) {
    console.error('❌ No complete 4-record set found in latest 20 records')
    console.log('💡 This may be due to 429 errors. Check earlier records.\n')
    process.exit(1)
  }

  const btc = fullSet.find(r => r.symbol === 'BTC')
  const eth = fullSet.find(r => r.symbol === 'ETH')
  const xrp = fullSet.find(r => r.symbol === 'XRP')
  const total = fullSet.find(r => r.symbol === 'TOTAL')

  console.log(`📅 Analyzing update from: ${new Date(fullSet[0].created_at).toLocaleString()}\n`)

  console.log('═══════════════════════════════════════')
  console.log('📊 Individual Coin Data')
  console.log('═══════════════════════════════════════')
  console.table([
    { Symbol: 'BTC', RSI: btc.rsi_average.toFixed(4), MACD: btc.macd_line.toFixed(6), Signal: btc.macd_signal.toFixed(6), Histogram: btc.macd_histogram.toFixed(6), 'BB Mid': btc.bb_middle ? btc.bb_middle.toFixed(2) : 'null' },
    { Symbol: 'ETH', RSI: eth.rsi_average.toFixed(4), MACD: eth.macd_line.toFixed(6), Signal: eth.macd_signal.toFixed(6), Histogram: eth.macd_histogram.toFixed(6), 'BB Mid': eth.bb_middle ? eth.bb_middle.toFixed(2) : 'null' },
    { Symbol: 'XRP', RSI: xrp.rsi_average.toFixed(4), MACD: xrp.macd_line.toFixed(6), Signal: xrp.macd_signal.toFixed(6), Histogram: xrp.macd_histogram.toFixed(6), 'BB Mid': xrp.bb_middle ? xrp.bb_middle.toFixed(2) : 'null' }
  ])

  console.log('\n═══════════════════════════════════════')
  console.log('🎯 TOTAL Record Verification')
  console.log('═══════════════════════════════════════')

  // RSI Verification
  const expectedRSI = (btc.rsi_average + eth.rsi_average + xrp.rsi_average) / 3
  const rsiDiff = Math.abs(expectedRSI - total.rsi_average)
  const rsiMatch = rsiDiff < 0.01

  console.log('\n1️⃣  RSI Average:')
  console.log(`   Expected: (${btc.rsi_average.toFixed(4)} + ${eth.rsi_average.toFixed(4)} + ${xrp.rsi_average.toFixed(4)}) / 3 = ${expectedRSI.toFixed(4)}`)
  console.log(`   Actual:   ${total.rsi_average.toFixed(4)}`)
  console.log(`   Difference: ${rsiDiff.toFixed(6)}`)
  console.log(`   Status: ${rsiMatch ? '✅ PASS' : '❌ FAIL'}`)

  // MACD Verification
  const expectedMACD = (btc.macd_line + eth.macd_line + xrp.macd_line) / 3
  const macdDiff = Math.abs(expectedMACD - total.macd_line)
  const macdMatch = macdDiff < 0.000001

  console.log('\n2️⃣  MACD Line:')
  console.log(`   Expected: (${btc.macd_line.toFixed(6)} + ${eth.macd_line.toFixed(6)} + ${xrp.macd_line.toFixed(6)}) / 3 = ${expectedMACD.toFixed(6)}`)
  console.log(`   Actual:   ${total.macd_line.toFixed(6)}`)
  console.log(`   Difference: ${macdDiff.toFixed(9)}`)
  console.log(`   Status: ${macdMatch ? '✅ PASS' : '❌ FAIL'}`)

  // Bull Ratio Verification
  const expectedBull = expectedRSI / 100
  const bullDiff = Math.abs(expectedBull - total.bull_ratio)
  const bullMatch = bullDiff < 0.001

  console.log('\n3️⃣  Bull Ratio:')
  console.log(`   Expected: ${expectedRSI.toFixed(4)} / 100 = ${expectedBull.toFixed(4)}`)
  console.log(`   Actual:   ${total.bull_ratio.toFixed(4)}`)
  console.log(`   Difference: ${bullDiff.toFixed(6)}`)
  console.log(`   Status: ${bullMatch ? '✅ PASS' : '❌ FAIL'}`)

  // BB Verification
  const bbMatch = btc.bb_middle === total.bb_middle
  console.log('\n4️⃣  Bollinger Bands (TOTAL should use BTC):')
  console.log(`   BTC BB Middle:   ${btc.bb_middle ? btc.bb_middle.toFixed(2) : 'null'}`)
  console.log(`   TOTAL BB Middle: ${total.bb_middle ? total.bb_middle.toFixed(2) : 'null'}`)
  console.log(`   Status: ${bbMatch ? '✅ PASS' : '❌ FAIL'}`)

  console.log('\n═══════════════════════════════════════')
  console.log('📋 Final Results')
  console.log('═══════════════════════════════════════')

  const allPass = rsiMatch && macdMatch && bullMatch && bbMatch
  if (allPass) {
    console.log('✅ ALL TESTS PASSED!')
    console.log('🎉 TOTAL record calculations are 100% accurate\n')
  } else {
    console.log('❌ SOME TESTS FAILED')
    console.log('⚠️  TOTAL record has calculation errors\n')
  }

  process.exit(allPass ? 0 : 1)
}

verifyTotalCalculation()
