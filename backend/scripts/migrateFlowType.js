/**
 * Migration Script: Update flow_type from 'buy'/'sell' to 'inflow'/'outflow'
 * Date: 2025-11-23
 * Purpose: Fix whale visibility issue after terminology change
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function migrateFlowTypes() {
  console.log('🔄 Starting flow_type migration...\n')

  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current flow_type distribution...')
    const { data: beforeData, error: beforeError } = await supabase
      .from('whale_events')
      .select('flow_type')
      .in('flow_type', ['buy', 'sell', 'inflow', 'outflow'])

    if (beforeError) {
      throw new Error(`Failed to query current state: ${beforeError.message}`)
    }

    const counts = beforeData.reduce((acc, row) => {
      acc[row.flow_type] = (acc[row.flow_type] || 0) + 1
      return acc
    }, {})

    console.log('Current distribution:')
    console.log(`  - buy: ${counts.buy || 0}`)
    console.log(`  - sell: ${counts.sell || 0}`)
    console.log(`  - inflow: ${counts.inflow || 0}`)
    console.log(`  - outflow: ${counts.outflow || 0}`)
    console.log('')

    // Step 2: Update 'buy' to 'inflow'
    console.log('🔄 Step 2: Updating buy → inflow...')
    const { data: buyUpdate, error: buyError } = await supabase
      .from('whale_events')
      .update({ flow_type: 'inflow' })
      .eq('flow_type', 'buy')
      .select('id')

    if (buyError) {
      throw new Error(`Failed to update buy → inflow: ${buyError.message}`)
    }

    console.log(`✅ Updated ${buyUpdate?.length || 0} records from 'buy' to 'inflow'\n`)

    // Step 3: Update 'sell' to 'outflow'
    console.log('🔄 Step 3: Updating sell → outflow...')
    const { data: sellUpdate, error: sellError } = await supabase
      .from('whale_events')
      .update({ flow_type: 'outflow' })
      .eq('flow_type', 'sell')
      .select('id')

    if (sellError) {
      throw new Error(`Failed to update sell → outflow: ${sellError.message}`)
    }

    console.log(`✅ Updated ${sellUpdate?.length || 0} records from 'sell' to 'outflow'\n`)

    // Step 4: Verify migration
    console.log('✅ Step 4: Verifying migration...')
    const { data: afterData, error: afterError } = await supabase
      .from('whale_events')
      .select('flow_type')
      .in('flow_type', ['buy', 'sell', 'inflow', 'outflow'])

    if (afterError) {
      throw new Error(`Failed to verify migration: ${afterError.message}`)
    }

    const afterCounts = afterData.reduce((acc, row) => {
      acc[row.flow_type] = (acc[row.flow_type] || 0) + 1
      return acc
    }, {})

    console.log('After migration:')
    console.log(`  - buy: ${afterCounts.buy || 0} (should be 0)`)
    console.log(`  - sell: ${afterCounts.sell || 0} (should be 0)`)
    console.log(`  - inflow: ${afterCounts.inflow || 0}`)
    console.log(`  - outflow: ${afterCounts.outflow || 0}`)
    console.log('')

    // Step 5: Sample verification
    console.log('📋 Step 5: Sample records after migration...')
    const { data: samples, error: sampleError } = await supabase
      .from('whale_events')
      .select('id, symbol, flow_type, amount_usd, timestamp')
      .in('flow_type', ['inflow', 'outflow'])
      .order('timestamp', { ascending: false })
      .limit(5)

    if (sampleError) {
      console.warn('⚠️ Could not fetch sample records:', sampleError.message)
    } else {
      console.log('Recent records:')
      samples.forEach(record => {
        console.log(`  - ${record.symbol.toUpperCase()} | ${record.flow_type.toUpperCase()} | $${(record.amount_usd / 1e6).toFixed(2)}M | ${new Date(record.timestamp).toLocaleString()}`)
      })
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('🎉 Whales should now be visible in the frontend!')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration
migrateFlowTypes()
