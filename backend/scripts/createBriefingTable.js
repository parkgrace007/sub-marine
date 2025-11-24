/**
 * 📊 Create market_briefings table in Supabase
 *
 * Table schema:
 * - id: UUID (auto-generated)
 * - content: TEXT (AI-generated analysis in Korean)
 * - metadata: JSONB (price, sentiment, news data)
 * - created_at: TIMESTAMPTZ
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function createTable() {
  console.log('📊 Creating market_briefings table...\n')

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Drop existing table if exists
      DROP TABLE IF EXISTS market_briefings;

      -- Create market_briefings table
      CREATE TABLE market_briefings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes for better query performance
      CREATE INDEX idx_briefings_created_at ON market_briefings(created_at DESC);

      -- Enable Row Level Security (RLS)
      ALTER TABLE market_briefings ENABLE ROW LEVEL SECURITY;

      -- Create policy to allow anonymous read access
      CREATE POLICY "Allow public read access"
        ON market_briefings
        FOR SELECT
        TO anon
        USING (true);

      -- Create policy to allow service role full access
      CREATE POLICY "Allow service role all operations"
        ON market_briefings
        FOR ALL
        TO service_role
        USING (true);
    `
  })

  if (error) {
    // If rpc method doesn't exist, use direct SQL execution
    console.log('⚠️  exec_sql RPC not found, trying direct SQL execution...\n')

    try {
      // Execute SQL statements one by one
      const statements = [
        'DROP TABLE IF EXISTS market_briefings CASCADE',
        `CREATE TABLE market_briefings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        'CREATE INDEX idx_briefings_created_at ON market_briefings(created_at DESC)',
        'ALTER TABLE market_briefings ENABLE ROW LEVEL SECURITY'
      ]

      for (const sql of statements) {
        const { error: execError } = await supabase.rpc('exec', { sql })
        if (execError) {
          console.error(`❌ Failed to execute: ${sql}`)
          console.error(`   Error: ${execError.message}\n`)
        } else {
          console.log(`✅ Executed: ${sql.substring(0, 50)}...`)
        }
      }

      console.log('\n⚠️  Note: You may need to manually set up RLS policies in Supabase Dashboard')
      console.log('   Go to: https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/auth/policies')
      console.log('')
      console.log('   Create these policies:')
      console.log('   1. Allow public read: SELECT, anon role, true')
      console.log('   2. Allow service full access: ALL, service_role, true')

    } catch (directError) {
      console.error('❌ Direct SQL execution also failed')
      console.error('   Please run this SQL manually in Supabase SQL Editor:\n')
      console.log(`
-- Copy and paste this into Supabase SQL Editor
DROP TABLE IF EXISTS market_briefings CASCADE;

CREATE TABLE market_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_briefings_created_at ON market_briefings(created_at DESC);

ALTER TABLE market_briefings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access"
  ON market_briefings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow service role all operations"
  ON market_briefings
  FOR ALL
  TO service_role
  USING (true);
      `)
      process.exit(1)
    }
  } else {
    console.log('✅ market_briefings table created successfully!\n')
  }

  // Verify table creation
  const { data: tables, error: verifyError } = await supabase
    .from('market_briefings')
    .select('id')
    .limit(1)

  if (verifyError) {
    console.error('❌ Table verification failed:', verifyError.message)
    console.error('   Please check Supabase Dashboard\n')
  } else {
    console.log('✅ Table verification passed!')
    console.log('   Table is ready to use\n')
  }

  console.log('📋 Table schema:')
  console.log('   - id: UUID (auto-generated)')
  console.log('   - content: TEXT (AI analysis in Korean)')
  console.log('   - metadata: JSONB (price, sentiment, news)')
  console.log('   - created_at: TIMESTAMPTZ\n')

  process.exit(0)
}

createTable().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
