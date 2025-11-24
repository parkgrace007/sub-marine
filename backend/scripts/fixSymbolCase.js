import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function fixSymbolCase() {
  console.log('\n🔧 Fixing symbol case inconsistency in database...\n')

  // Find all lowercase symbols
  const { data: lowercaseSymbols, error: fetchError } = await supabase
    .from('whale_events')
    .select('symbol')
    .ilike('symbol', 'xrp')  // Case-insensitive search

  if (fetchError) {
    console.error('❌ Error fetching symbols:', fetchError)
    process.exit(1)
  }

  console.log(`Found ${lowercaseSymbols.length} records with lowercase 'xrp'`)

  // Update to uppercase
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: "UPDATE whale_events SET symbol = UPPER(symbol) WHERE symbol != UPPER(symbol)"
  })

  if (error) {
    console.log('⚠️  RPC not available, using direct update...')

    // Alternative: Update each symbol type
    const { error: updateError } = await supabase
      .from('whale_events')
      .update({ symbol: 'XRP' })
      .eq('symbol', 'xrp')

    if (updateError) {
      console.error('❌ Error updating symbols:', updateError)
      process.exit(1)
    }
  }

  // Verify fix
  const { data: afterUpdate, error: verifyError } = await supabase
    .from('whale_events')
    .select('symbol')
    .eq('symbol', 'xrp')

  if (verifyError) {
    console.error('❌ Error verifying:', verifyError)
    process.exit(1)
  }

  console.log(`\n✅ After update: ${afterUpdate?.length || 0} lowercase 'xrp' records (should be 0)`)

  // Check uppercase
  const { data: uppercase, error: upperError } = await supabase
    .from('whale_events')
    .select('symbol')
    .eq('symbol', 'XRP')

  if (!upperError) {
    console.log(`✅ Uppercase 'XRP' records: ${uppercase?.length || 0}`)
  }

  console.log('\n✅ Database symbol case standardization complete!\n')
  process.exit(0)
}

fixSymbolCase()
