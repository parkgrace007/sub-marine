import { supabase } from '../src/utils/supabase.js'
import swsiService from '../src/services/swsi.js'

console.log('⏳ Waiting for schema update to complete...\n')

let attempts = 0
const maxAttempts = 60 // 60 seconds max wait

const checkInterval = setInterval(async () => {
  attempts++

  try {
    // Test if new columns exist by trying to insert
    const testRecord = {
      timestamp: Math.floor(Date.now() / 1000),
      timeframe: '5min',
      swsi_score: 0,
      bull_ratio: 0.5,
      bear_ratio: 0.5,
      global_change: 0,
      coins_change: 0,
      volume_change: 0,
      whale_weight: 0,
      total_volume_usd: 0,
      buy_volume_usd: 0,
      sell_volume_usd: 0,
      whale_count: 0
    }

    const { data, error } = await supabase
      .from('market_sentiment')
      .insert([testRecord])
      .select()

    if (error) {
      console.log(`[${attempts}/${maxAttempts}] Schema not ready yet...`)
    } else {
      // Success! Clean up test record
      await supabase.from('market_sentiment').delete().eq('id', data[0].id)

      console.log('\n✅ Schema updated successfully!\n')
      clearInterval(checkInterval)

      // Run SWSI calculation
      console.log('🐋 Running SWSI calculation...\n')
      const results = await swsiService.calculateAll()

      console.log('\n━'.repeat(60))
      console.log('📊 SWSI Calculation Results:\n')

      results.forEach((result, i) => {
        console.log(`${i + 1}. ${result.timeframe.toUpperCase()}:`)
        console.log(`   SWSI: ${result.swsi_score.toFixed(4)}`)
        console.log(`   Bull: ${(result.bull_ratio * 100).toFixed(2)}% | Bear: ${(result.bear_ratio * 100).toFixed(2)}%`)
        console.log(`   Whales: ${result.whale_count} ($${(result.total_volume_usd / 1e6).toFixed(2)}M)`)
        console.log()
      })

      console.log('✅ Phase 5 완료!')
      console.log('📡 Frontend에서 실시간으로 SWSI 데이터를 받습니다.\n')

      process.exit(0)
    }
  } catch (err) {
    console.log(`[${attempts}/${maxAttempts}] Error:`, err.message)
  }

  if (attempts >= maxAttempts) {
    console.error('\n❌ Timeout waiting for schema update.')
    console.error('Please ensure the SQL was run successfully in Supabase.\n')
    clearInterval(checkInterval)
    process.exit(1)
  }
}, 1000)

console.log('💡 While waiting, please:')
console.log('   1. Go to https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new')
console.log('   2. Paste the SQL from backend/scripts/schema_update.sql')
console.log('   3. Click "Run"\n')
