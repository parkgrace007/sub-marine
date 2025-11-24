/**
 * Execute SQL migration to update flow_type constraint
 * Date: 2025-11-23
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function executeMigration() {
  console.log('🔄 Starting database constraint migration...\n')

  try {
    // Step 1: Drop old constraint
    console.log('📊 Step 1: Dropping old constraint...')
    const { data: dropData, error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE whale_events DROP CONSTRAINT IF EXISTS valid_flow_type'
    })

    if (dropError) {
      console.log('⚠️  Could not drop constraint (may not exist):', dropError.message)
    } else {
      console.log('✅ Old constraint dropped\n')
    }

    // Step 2: Add new constraint
    console.log('📊 Step 2: Adding new constraint with inflow/outflow...')
    const { data: addData, error: addError } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE whale_events ADD CONSTRAINT valid_flow_type CHECK (flow_type IN ('inflow', 'outflow', 'exchange', 'internal', 'defi'))"
    })

    if (addError) {
      throw new Error(`Failed to add new constraint: ${addError.message}`)
    }
    console.log('✅ New constraint added\n')

    // Step 3: Update buy → inflow
    console.log('📊 Step 3: Updating buy → inflow...')
    const { data: buyData, error: buyError } = await supabase
      .from('whale_events')
      .update({ flow_type: 'inflow' })
      .eq('flow_type', 'buy')
      .select('id')

    if (buyError) {
      throw new Error(`Failed to update buy: ${buyError.message}`)
    }
    console.log(`✅ Updated ${buyData?.length || 0} records: buy → inflow\n`)

    // Step 4: Update sell → outflow
    console.log('📊 Step 4: Updating sell → outflow...')
    const { data: sellData, error: sellError } = await supabase
      .from('whale_events')
      .update({ flow_type: 'outflow' })
      .eq('flow_type', 'sell')
      .select('id')

    if (sellError) {
      throw new Error(`Failed to update sell: ${sellError.message}`)
    }
    console.log(`✅ Updated ${sellData?.length || 0} records: sell → outflow\n`)

    // Step 5: Verify
    console.log('📊 Step 5: Verifying migration...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('whale_events')
      .select('flow_type')

    if (verifyError) {
      console.warn('⚠️  Could not verify:', verifyError.message)
    } else {
      const counts = verifyData.reduce((acc, row) => {
        acc[row.flow_type] = (acc[row.flow_type] || 0) + 1
        return acc
      }, {})

      console.log('Flow type distribution:')
      Object.entries(counts).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`)
      })
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('🎉 Whales should now be visible in the frontend!')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

executeMigration()
