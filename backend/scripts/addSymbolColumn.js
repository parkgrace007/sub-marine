import { supabase } from '../src/utils/supabase.js'

/**
 * Add 'symbol' column to market_sentiment table
 *
 * This migration adds symbol column to support per-coin filtering
 * Default value: 'COMBINED' for backward compatibility
 */
async function addSymbolColumn() {
  console.log('🔧 Adding symbol column to market_sentiment table...\n')

  try {
    // Step 1: Add symbol column with default value
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE market_sentiment
        ADD COLUMN IF NOT EXISTS symbol TEXT DEFAULT 'COMBINED';
      `
    })

    if (alterError) {
      // If rpc('exec_sql') doesn't exist, use alternative approach
      console.log('⚠️  RPC method not available. Please run this SQL manually in Supabase dashboard:\n')
      console.log('ALTER TABLE market_sentiment')
      console.log("ADD COLUMN IF NOT EXISTS symbol TEXT DEFAULT 'COMBINED';")
      console.log('\nSQL Editor URL: https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new')
      return
    }

    console.log('✅ Successfully added symbol column')

    // Step 2: Verify the change
    const { data, error: selectError } = await supabase
      .from('market_sentiment')
      .select('timestamp, timeframe, symbol')
      .order('timestamp', { ascending: false })
      .limit(5)

    if (selectError) {
      console.error('❌ Failed to verify column:', selectError.message)
      return
    }

    console.log('\n✅ Verification: Latest 5 records')
    console.table(data)

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📝 Please run this SQL manually in Supabase dashboard:')
    console.log('ALTER TABLE market_sentiment')
    console.log("ADD COLUMN IF NOT EXISTS symbol TEXT DEFAULT 'COMBINED';")
    console.log('\nSQL Editor URL: https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new')
  }
}

// Run migration
addSymbolColumn()
