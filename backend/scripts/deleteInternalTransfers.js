import { supabase } from '../src/utils/supabase.js'

console.log('🗑️  Deleting Internal Transfers (Unknown wallet → Unknown wallet)\n')

async function deleteInternalTransfers() {
  try {
    // 1. Count existing internal transfers
    console.log('📊 Checking for internal transfers...')
    const { count: existingCount, error: countError } = await supabase
      .from('whale_events')
      .select('*', { count: 'exact', head: true })
      .eq('flow_type', 'internal')

    if (countError) {
      console.error('❌ Error counting:', countError.message)
      process.exit(1)
    }

    console.log(`Found ${existingCount || 0} internal transfer records\n`)

    if (existingCount === 0) {
      console.log('✅ No internal transfers to delete')
      console.log('✅ Database is clean - only Mint, Burn, Buy, Sell remain!')
      process.exit(0)
    }

    // 2. Delete internal transfers
    console.log(`🗑️  Deleting ${existingCount} internal transfers...`)
    const { count: deletedCount, error: deleteError } = await supabase
      .from('whale_events')
      .delete({ count: 'exact' })
      .eq('flow_type', 'internal')

    if (deleteError) {
      console.error('❌ Delete error:', deleteError.message)
      process.exit(1)
    }

    console.log(`✅ Successfully deleted ${deletedCount || 0} records`)

    // 3. Verify deletion
    console.log('\n🔍 Verifying deletion...')
    const { count: remainingCount } = await supabase
      .from('whale_events')
      .select('*', { count: 'exact', head: true })
      .eq('flow_type', 'internal')

    if (remainingCount === 0) {
      console.log('✅ All internal transfers successfully deleted!')
      console.log('✅ Only Mint, Burn, Buy, Sell transactions remain!')
    } else {
      console.warn(`⚠️  Warning: ${remainingCount} records still remain`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

deleteInternalTransfers()
