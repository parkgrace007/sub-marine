import swsiService from '../src/services/swsi.js'

console.log('🐋 SWSI Calculation Test\n')
console.log('━'.repeat(60))

// Calculate SWSI for all timeframes
try {
  console.log('\n⏱️  Calculating SWSI...\n')

  const results = await swsiService.calculateAll()

  console.log('\n\n━'.repeat(60))
  console.log('📊 SWSI Calculation Complete!\n')

  console.log('Results:')
  results.forEach((result, i) => {
    console.log(`\n${i + 1}. ${result.timeframe.toUpperCase()}:`)
    console.log(`   SWSI Score: ${result.swsi_score.toFixed(4)}`)
    console.log(`   Bull Ratio: ${(result.bull_ratio * 100).toFixed(2)}%`)
    console.log(`   Bear Ratio: ${(result.bear_ratio * 100).toFixed(2)}%`)
    console.log(`   Components:`)
    console.log(`     G (Market Cap): ${result.global_change.toFixed(4)}`)
    console.log(`     B (Big Coins):  ${result.coins_change.toFixed(4)}`)
    console.log(`     V (Volume):     ${result.volume_change.toFixed(4)}`)
    console.log(`     W (Whales):     ${result.whale_weight.toFixed(4)}`)
    console.log(`   Whale Stats:`)
    console.log(`     Total Volume: $${(result.total_volume_usd / 1e6).toFixed(2)}M`)
    console.log(`     Buy Volume:   $${(result.buy_volume_usd / 1e6).toFixed(2)}M`)
    console.log(`     Sell Volume:  $${(result.sell_volume_usd / 1e6).toFixed(2)}M`)
    console.log(`     Whale Count:  ${result.whale_count}`)
  })

  console.log('\n✅ SWSI data saved to market_sentiment table')
  console.log('📡 Frontend will receive this via Realtime subscription\n')

  process.exit(0)
} catch (error) {
  console.error('\n❌ SWSI calculation failed:', error.message)
  console.error(error.stack)
  process.exit(1)
}
