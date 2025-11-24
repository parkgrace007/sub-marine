import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function cleanWhaleData() {
  console.log('\n🧹 WHALE DATA CLEANUP\n');
  console.log('='.repeat(60));

  // 1. Check current data
  console.log('\n📊 Current whale_events data:\n');

  const { count: totalCount, error: countError } = await supabase
    .from('whale_events')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('❌ Error fetching count:', countError.message);
  } else {
    console.log(`Total records: ${totalCount || 0}`);
  }

  // 2. Confirm deletion
  console.log('\n⚠️  WARNING: This will DELETE ALL whale_events data!');
  console.log('This prepares for the new configuration:');
  console.log('  - Blockchains: bitcoin, ethereum, tron, ripple');
  console.log('  - Minimum: $10M (up from $1M)');
  console.log('\n Proceeding with deletion in 3 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Delete all whale_events
  console.log('🗑️  Deleting all whale_events...');

  const { error: deleteError } = await supabase
    .from('whale_events')
    .delete()
    .not('id', 'is', null); // Delete all rows (id is not null = all rows)

  if (deleteError) {
    console.log('❌ Error deleting data:', deleteError.message);
    process.exit(1);
  }

  // 4. Verify deletion
  const { count: afterCount } = await supabase
    .from('whale_events')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Deletion complete!`);
  console.log(`   Records remaining: ${afterCount}`);

  if (afterCount === 0) {
    console.log('\n🎉 whale_events table is now clean and ready for new data!');
  } else {
    console.log('\n⚠️  Warning: Some records remain. Please check manually.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Next steps:');
  console.log('1. Update whaleAlert.js configuration');
  console.log('2. Restart backend server');
  console.log('3. Monitor new whale data coming in');
  console.log('='.repeat(60) + '\n');
}

cleanWhaleData().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
