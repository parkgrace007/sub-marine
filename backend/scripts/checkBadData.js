import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function check() {
  console.log('🔍 Checking for problematic records...\n')

  // Find records with 'unknown' in from_owner and flow_type = inflow
  const { data: unknownFrom, error: error1 } = await supabase
    .from('whale_events')
    .select('id, from_owner, to_owner, flow_type, amount_usd, symbol')
    .ilike('from_owner', '%unknown%')
    .eq('flow_type', 'inflow')
    .limit(20)

  console.log('1. Records with from_owner containing "unknown" AND flow_type=inflow:')
  if (unknownFrom && unknownFrom.length > 0) {
    unknownFrom.forEach(e => {
      console.log(`   ID: ${e.id}, from: ${e.from_owner}, to: ${e.to_owner}, flow: ${e.flow_type}, amount: $${e.amount_usd?.toLocaleString() || 0}`)
    })
  } else {
    console.log('   None found')
  }

  // Check what values exist in from_owner
  const { data: fromOwnerSample } = await supabase
    .from('whale_events')
    .select('from_owner')
    .limit(50)

  console.log('\n2. Sample from_owner values:')
  const uniqueFrom = [...new Set(fromOwnerSample?.map(e => e.from_owner) || [])]
  uniqueFrom.slice(0, 10).forEach(v => console.log(`   "${v}"`))

  // Check for NULL vs empty string vs 'Unknown wallet'
  const { data: nullFrom } = await supabase
    .from('whale_events')
    .select('id')
    .is('from_owner', null)

  const { data: emptyFrom } = await supabase
    .from('whale_events')
    .select('id')
    .eq('from_owner', '')

  console.log('\n3. NULL/Empty from_owner stats:')
  console.log(`   from_owner IS NULL: ${nullFrom?.length || 0}`)
  console.log(`   from_owner = '': ${emptyFrom?.length || 0}`)

  // Check amount_usd = 0
  const { data: zeroAmount } = await supabase
    .from('whale_events')
    .select('id, from_owner, to_owner, flow_type, amount_usd, symbol')
    .eq('amount_usd', 0)
    .limit(10)

  console.log('\n4. Records with amount_usd = 0:')
  if (zeroAmount && zeroAmount.length > 0) {
    zeroAmount.forEach(e => {
      console.log(`   ID: ${e.id}, symbol: ${e.symbol}, from: ${e.from_owner}, to: ${e.to_owner}, flow: ${e.flow_type}`)
    })
  } else {
    console.log('   None found')
  }

  // MOST IMPORTANT: Find wallet→wallet that are marked as inflow
  console.log('\n5. 🚨 CRITICAL: Looking for wallet→wallet marked as inflow...')

  // Both from and to contain 'unknown'
  const { data: bothUnknown } = await supabase
    .from('whale_events')
    .select('id, from_owner, to_owner, flow_type, amount_usd, symbol')
    .ilike('from_owner', '%unknown%')
    .ilike('to_owner', '%unknown%')
    .eq('flow_type', 'inflow')
    .limit(20)

  if (bothUnknown && bothUnknown.length > 0) {
    console.log(`   Found ${bothUnknown.length} records! These should be INTERNAL:`)
    bothUnknown.forEach(e => {
      console.log(`   ID: ${e.id}, symbol: ${e.symbol}, from: ${e.from_owner}, to: ${e.to_owner}, amount: $${e.amount_usd?.toLocaleString() || 0}`)
    })
  } else {
    console.log('   None found (good!)')
  }

  // Also check where from_owner or to_owner is NULL
  const { data: nullBoth } = await supabase
    .from('whale_events')
    .select('id, from_owner, to_owner, flow_type, amount_usd, symbol')
    .is('from_owner', null)
    .is('to_owner', null)
    .eq('flow_type', 'inflow')
    .limit(20)

  console.log('\n6. Records where from_owner IS NULL AND to_owner IS NULL AND flow_type=inflow:')
  if (nullBoth && nullBoth.length > 0) {
    console.log(`   Found ${nullBoth.length} records! These should be INTERNAL:`)
    nullBoth.forEach(e => {
      console.log(`   ID: ${e.id}, symbol: ${e.symbol}, amount: $${e.amount_usd?.toLocaleString() || 0}`)
    })
  } else {
    console.log('   None found (good!)')
  }
}

check().catch(console.error)
