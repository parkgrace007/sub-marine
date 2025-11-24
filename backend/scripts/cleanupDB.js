import { supabase } from '../src/utils/supabase.js'

console.log('🗑️  Database Cleanup Script\n')
console.log('━'.repeat(60))

async function cleanup() {
  try {
    // Delete whale_events older than 24 hours
    console.log('\n1. Cleaning whale_events table...')
    const whaleEventsCutoff = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)

    const { count: whaleEventsDeleted, error: whaleError } = await supabase
      .from('whale_events')
      .delete({ count: 'exact' })
      .lt('timestamp', whaleEventsCutoff)

    if (whaleError) {
      console.error('   ❌ Error:', whaleError.message)
    } else {
      console.log(`   ✅ Deleted ${whaleEventsDeleted || 0} old whale_events (>24 hours)`)
    }

    // Delete market_sentiment older than 7 days
    console.log('\n2. Cleaning market_sentiment table...')
    const sentimentCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { count: sentimentDeleted, error: sentimentError } = await supabase
      .from('market_sentiment')
      .delete({ count: 'exact' })
      .lt('created_at', sentimentCutoff)

    if (sentimentError) {
      console.error('   ❌ Error:', sentimentError.message)
    } else {
      console.log(`   ✅ Deleted ${sentimentDeleted || 0} old market_sentiment (>7 days)`)
    }

    console.log('\n━'.repeat(60))
    console.log('✅ Database cleanup completed!\n')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

cleanup()
