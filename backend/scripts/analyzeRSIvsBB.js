import { supabase } from '../src/utils/supabase.js'

async function analyzeRSIvsBB() {
  console.log('\n📊 RSI vs BB Middle - Movement Scale Analysis\n')
  console.log('════════════════════════════════════════════════════════════════')

  // Fetch recent data for all coins
  const symbols = ['BTC', 'ETH', 'XRP', 'TOTAL']
  const timeframes = ['1h', '4h', '8h', '12h', '1d']

  for (const timeframe of timeframes) {
    console.log(`\n\n🔍 Analyzing ${timeframe} timeframe...`)
    console.log('─'.repeat(64))

    for (const symbol of symbols) {
      const { data, error } = await supabase
        .from('market_sentiment')
        .select('timestamp, symbol, rsi_average, bb_middle, created_at')
        .eq('timeframe', timeframe)
        .eq('symbol', symbol)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error(`Error fetching ${symbol}:`, error.message)
        continue
      }

      if (data.length < 2) {
        console.log(`\n${symbol}: Not enough data (${data.length} records)`)
        continue
      }

      // Calculate statistics
      let rsiChanges = []
      let bbChanges = []
      let rsiValues = []
      let bbValues = []

      for (let i = 0; i < data.length - 1; i++) {
        const curr = data[i]
        const prev = data[i + 1]

        if (curr.rsi_average !== null && prev.rsi_average !== null) {
          const rsiChange = Math.abs(curr.rsi_average - prev.rsi_average)
          rsiChanges.push(rsiChange)
          rsiValues.push(curr.rsi_average)
        }

        if (curr.bb_middle !== null && prev.bb_middle !== null) {
          const bbChange = Math.abs(curr.bb_middle - prev.bb_middle)
          bbChanges.push(bbChange)
          bbValues.push(curr.bb_middle)
        }
      }

      if (rsiValues.length === 0 || bbValues.length === 0) {
        console.log(`\n${symbol}: Insufficient data for analysis`)
        continue
      }

      // RSI Statistics
      const rsiMin = Math.min(...rsiValues)
      const rsiMax = Math.max(...rsiValues)
      const rsiRange = rsiMax - rsiMin
      const rsiAvgChange = rsiChanges.reduce((a, b) => a + b, 0) / rsiChanges.length
      const rsiMaxChange = Math.max(...rsiChanges)

      // BB Statistics
      const bbMin = Math.min(...bbValues)
      const bbMax = Math.max(...bbValues)
      const bbRange = bbMax - bbMin
      const bbAvgChange = bbChanges.reduce((a, b) => a + b, 0) / bbChanges.length
      const bbMaxChange = Math.max(...bbChanges)

      console.log(`\n📈 ${symbol}:`)
      console.log('   ┌─ RSI Movement')
      console.log(`   │  Range: ${rsiMin.toFixed(2)} ~ ${rsiMax.toFixed(2)} (span: ${rsiRange.toFixed(2)})`)
      console.log(`   │  Avg Change: ${rsiAvgChange.toFixed(2)} points/update`)
      console.log(`   │  Max Change: ${rsiMaxChange.toFixed(2)} points`)
      console.log(`   │  % of 0-100 range: ${(rsiAvgChange / 100 * 100).toFixed(3)}%`)
      console.log('   │')
      console.log('   ├─ BB Middle Movement')
      console.log(`   │  Range: $${bbMin.toFixed(2)} ~ $${bbMax.toFixed(2)} (span: $${bbRange.toFixed(2)})`)
      console.log(`   │  Avg Change: $${bbAvgChange.toFixed(2)}/update`)
      console.log(`   │  Max Change: $${bbMaxChange.toFixed(2)}`)
      console.log(`   │  % of observed range: ${(bbAvgChange / bbRange * 100).toFixed(3)}%`)
      console.log('   │')
      console.log('   └─ Comparison')

      // Normalize to percentage of range
      const rsiNormalizedAvg = (rsiAvgChange / 100) * 100
      const bbNormalizedAvg = (bbAvgChange / bbRange) * 100

      console.log(`      RSI moves ${rsiNormalizedAvg.toFixed(3)}% of total range per update`)
      console.log(`      BB moves ${bbNormalizedAvg.toFixed(3)}% of observed range per update`)
      console.log(`      Ratio (BB/RSI volatility): ${(bbNormalizedAvg / rsiNormalizedAvg).toFixed(2)}x`)

      // Volatility comparison
      const rsiStdDev = Math.sqrt(rsiChanges.reduce((sum, val) => sum + Math.pow(val - rsiAvgChange, 2), 0) / rsiChanges.length)
      const bbStdDev = Math.sqrt(bbChanges.reduce((sum, val) => sum + Math.pow(val - bbAvgChange, 2), 0) / bbChanges.length)

      console.log(`      RSI CV: ${(rsiStdDev / rsiAvgChange * 100).toFixed(1)}% | BB CV: ${(bbStdDev / bbAvgChange * 100).toFixed(1)}%`)
    }
  }

  console.log('\n\n════════════════════════════════════════════════════════════════')
  console.log('✅ Analysis complete\n')
}

analyzeRSIvsBB()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
