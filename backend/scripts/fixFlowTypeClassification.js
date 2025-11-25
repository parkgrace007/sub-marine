/**
 * Fix flow_type classification for whale_events (2025-11-25)
 *
 * Policy:
 * - INFLOW: exchange → wallet (거래소에서 지갑으로)
 * - OUTFLOW: wallet → exchange (지갑에서 거래소로)
 * - INTERNAL: wallet → wallet (지갑 간 이동)
 * - EXCHANGE: exchange → exchange (거래소 간)
 *
 * Bug: "Unknown wallet → Unknown wallet" was incorrectly classified as INFLOW
 * Fix: Update to INTERNAL
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function fixFlowTypeClassification() {
  console.log('🔧 Starting flow_type classification fix...\n')

  // Step 1: Check current distribution
  console.log('📊 Step 1: Checking current data distribution...')

  const { data: beforeStats, error: statsError } = await supabase
    .from('whale_events')
    .select('flow_type, from_owner, to_owner')

  if (statsError) {
    console.error('❌ Error fetching stats:', statsError.message)
    return
  }

  // Analyze problematic records
  const problematicInflow = beforeStats.filter(e =>
    e.flow_type === 'inflow' &&
    (!e.from_owner || e.from_owner === '' || e.from_owner.toLowerCase().includes('unknown')) &&
    (!e.to_owner || e.to_owner === '' || e.to_owner.toLowerCase().includes('unknown'))
  )

  const problematicOutflow = beforeStats.filter(e =>
    e.flow_type === 'outflow' &&
    (!e.from_owner || e.from_owner === '' || e.from_owner.toLowerCase().includes('unknown')) &&
    (!e.to_owner || e.to_owner === '' || e.to_owner.toLowerCase().includes('unknown'))
  )

  console.log(`   Total records: ${beforeStats.length}`)
  console.log(`   Problematic INFLOW (wallet→wallet marked as inflow): ${problematicInflow.length}`)
  console.log(`   Problematic OUTFLOW (wallet→wallet marked as outflow): ${problematicOutflow.length}`)
  console.log('')

  // Step 2: Fix INFLOW → INTERNAL
  if (problematicInflow.length > 0) {
    console.log('📝 Step 2: Fixing INFLOW → INTERNAL...')

    const { data: inflowFix, error: inflowError } = await supabase
      .from('whale_events')
      .update({ flow_type: 'internal' })
      .or('from_owner.is.null,from_owner.eq.,from_owner.ilike.%unknown%')
      .or('to_owner.is.null,to_owner.eq.,to_owner.ilike.%unknown%')
      .eq('flow_type', 'inflow')
      .select('id')

    if (inflowError) {
      console.error('❌ Error fixing inflow:', inflowError.message)
    } else {
      console.log(`   ✅ Fixed ${inflowFix?.length || 0} records from INFLOW → INTERNAL`)
    }
  } else {
    console.log('📝 Step 2: No problematic INFLOW records found')
  }

  // Step 3: Fix OUTFLOW → INTERNAL
  if (problematicOutflow.length > 0) {
    console.log('📝 Step 3: Fixing OUTFLOW → INTERNAL...')

    const { data: outflowFix, error: outflowError } = await supabase
      .from('whale_events')
      .update({ flow_type: 'internal' })
      .or('from_owner.is.null,from_owner.eq.,from_owner.ilike.%unknown%')
      .or('to_owner.is.null,to_owner.eq.,to_owner.ilike.%unknown%')
      .eq('flow_type', 'outflow')
      .select('id')

    if (outflowError) {
      console.error('❌ Error fixing outflow:', outflowError.message)
    } else {
      console.log(`   ✅ Fixed ${outflowFix?.length || 0} records from OUTFLOW → INTERNAL`)
    }
  } else {
    console.log('📝 Step 3: No problematic OUTFLOW records found')
  }

  // Step 4: Delete incomplete data (amount_usd = 0)
  console.log('\n📝 Step 4: Checking for incomplete data (amount_usd = 0)...')

  const { data: zeroAmount, error: zeroError } = await supabase
    .from('whale_events')
    .select('id')
    .or('amount_usd.eq.0,amount_usd.is.null')

  if (zeroError) {
    console.error('❌ Error checking zero amount:', zeroError.message)
  } else if (zeroAmount && zeroAmount.length > 0) {
    console.log(`   Found ${zeroAmount.length} records with amount_usd = 0 or NULL`)

    const { error: deleteError } = await supabase
      .from('whale_events')
      .delete()
      .or('amount_usd.eq.0,amount_usd.is.null')

    if (deleteError) {
      console.error('❌ Error deleting zero amount records:', deleteError.message)
    } else {
      console.log(`   ✅ Deleted ${zeroAmount.length} incomplete records`)
    }
  } else {
    console.log('   ✅ No incomplete records found')
  }

  // Step 5: Verify final distribution
  console.log('\n📊 Step 5: Verifying final distribution...')

  const { data: afterStats } = await supabase
    .from('whale_events')
    .select('flow_type')

  if (afterStats) {
    const distribution = afterStats.reduce((acc, e) => {
      acc[e.flow_type] = (acc[e.flow_type] || 0) + 1
      return acc
    }, {})

    console.log('   Final flow_type distribution:')
    Object.entries(distribution).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`)
    })
  }

  console.log('\n✅ Migration complete!')
}

// Run
fixFlowTypeClassification().catch(console.error)
