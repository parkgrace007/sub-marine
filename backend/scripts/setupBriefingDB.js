/**
 * 📊 Setup market_briefings table using Supabase Admin API
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function setupTable() {
  console.log('📊 Setting up market_briefings table...\n')

  // SQL to create table
  const sql = `
-- Drop existing table if exists
DROP TABLE IF EXISTS market_briefings CASCADE;

-- Create market_briefings table
CREATE TABLE market_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_briefings_created_at ON market_briefings(created_at DESC);

-- Enable RLS
ALTER TABLE market_briefings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read
CREATE POLICY "Allow public read access"
  ON market_briefings
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policy: Allow service role full access
CREATE POLICY "Allow service role all operations"
  ON market_briefings
  FOR ALL
  TO service_role
  USING (true);
`

  console.log('Executing SQL...\n')
  console.log('Please run this SQL in Supabase SQL Editor:')
  console.log('URL: https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new\n')
  console.log('='.repeat(60))
  console.log(sql)
  console.log('='.repeat(60))
  console.log('\nAfter running the SQL, press Enter to verify...')
  console.log('Or skip verification and run: node scripts/testBriefing.js\n')

  // Try to verify if table exists
  try {
    const { data, error } = await supabase
      .from('market_briefings')
      .select('id')
      .limit(1)

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  Table not created yet. Please run the SQL above in Supabase.\n')
      } else {
        console.error('❌ Error checking table:', error.message)
      }
    } else {
      console.log('✅ Table exists and is accessible!\n')
      console.log('Ready to test. Run: node scripts/testBriefing.js\n')
    }
  } catch (err) {
    console.error('Error:', err.message)
  }

  process.exit(0)
}

setupTable()
