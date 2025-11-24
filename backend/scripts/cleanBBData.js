#!/usr/bin/env node
/**
 * Clean up abnormal BB (Bollinger Bands) data from the database
 *
 * Problem: On 11/17 between 5:28 PM - 6:18 PM, incorrect BB data was saved
 * with middle values around $48,000-$50,000 (half of actual BTC price)
 *
 * Solution: Delete or fix these abnormal records
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function cleanBBData() {
  console.log('🧹 Starting BB data cleanup...\n')

  // 1. First, let's see what we're dealing with
  console.log('📊 Fetching abnormal BB data...')

  const { data: abnormalData, error: fetchError } = await supabase
    .from('market_sentiment')
    .select('id, created_at, timeframe, symbol, bb_upper, bb_middle, bb_lower')
    .eq('symbol', 'COMBINED')
    .or('bb_middle.lt.80000,bb_middle.gt.110000')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('❌ Error fetching data:', fetchError)
    return
  }

  console.log(`Found ${abnormalData.length} abnormal records\n`)

  // Group by timeframe to see impact
  const byTimeframe = {}
  abnormalData.forEach(record => {
    if (!byTimeframe[record.timeframe]) {
      byTimeframe[record.timeframe] = []
    }
    byTimeframe[record.timeframe].push(record)
  })

  console.log('📈 Abnormal records by timeframe:')
  Object.entries(byTimeframe).forEach(([tf, records]) => {
    console.log(`  ${tf}: ${records.length} records`)

    // Show sample
    if (records.length > 0) {
      const sample = records[0]
      console.log(`    Sample: Middle=$${sample.bb_middle?.toFixed(2)} at ${new Date(sample.created_at).toLocaleString()}`)
    }
  })

  // 2. Ask for confirmation
  console.log('\n⚠️  About to delete the following records:')
  console.log('  - Records where bb_middle < $80,000 (too low for BTC)')
  console.log('  - Records where bb_middle > $110,000 (too high for current BTC)')
  console.log('  - Dummy records with values 60, 50, 40')

  // 3. Delete abnormal records
  console.log('\n🗑️  Deleting abnormal BB records...')

  const { error: deleteError, count } = await supabase
    .from('market_sentiment')
    .delete()
    .eq('symbol', 'COMBINED')
    .or('bb_middle.lt.80000,bb_middle.gt.110000,and(bb_upper.eq.60,bb_middle.eq.50,bb_lower.eq.40)')

  if (deleteError) {
    console.error('❌ Error deleting records:', deleteError)
    return
  }

  console.log(`✅ Successfully deleted ${count || abnormalData.length} abnormal BB records`)

  // 4. Verify cleanup
  console.log('\n🔍 Verifying cleanup...')

  const { data: remainingAbnormal, error: verifyError } = await supabase
    .from('market_sentiment')
    .select('count')
    .eq('symbol', 'COMBINED')
    .or('bb_middle.lt.80000,bb_middle.gt.110000')
    .single()

  if (verifyError && verifyError.code !== 'PGRST116') {
    console.error('❌ Error verifying:', verifyError)
  } else {
    const remaining = remainingAbnormal?.count || 0
    if (remaining === 0) {
      console.log('✅ All abnormal BB data has been cleaned!')
    } else {
      console.log(`⚠️  ${remaining} abnormal records still remain`)
    }
  }

  // 5. Show current status
  console.log('\n📊 Current BB data status:')

  const timeframes = ['1h', '4h', '8h', '12h', '1d']
  for (const tf of timeframes) {
    const { data: latest } = await supabase
      .from('market_sentiment')
      .select('bb_upper, bb_middle, bb_lower, created_at')
      .eq('symbol', 'COMBINED')
      .eq('timeframe', tf)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (latest && latest.bb_middle) {
      console.log(`  ${tf}: Middle=$${latest.bb_middle.toFixed(2)}, Width=$${(latest.bb_upper - latest.bb_lower).toFixed(2)}`)
    } else {
      console.log(`  ${tf}: No valid BB data`)
    }
  }

  console.log('\n✨ Cleanup complete!')
  process.exit(0)
}

// Run the cleanup
cleanBBData().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})