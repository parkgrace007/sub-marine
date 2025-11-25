/**
 * Add content_en column to market_briefings table for bilingual support
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function addEnglishColumn() {
  console.log('📊 Adding content_en column to market_briefings table...\n')

  const sql = `
-- Add content_en column for English briefings
ALTER TABLE market_briefings
ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Add comment for documentation
COMMENT ON COLUMN market_briefings.content_en IS 'English version of the briefing content';
`

  console.log('Please run this SQL in Supabase SQL Editor:')
  console.log('URL: https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new\n')
  console.log('='.repeat(60))
  console.log(sql)
  console.log('='.repeat(60))

  // Verify column exists
  try {
    const { data, error } = await supabase
      .from('market_briefings')
      .select('content_en')
      .limit(1)

    if (error && error.message.includes('content_en')) {
      console.log('\n⚠️  Column content_en does not exist yet. Please run the SQL above.\n')
    } else {
      console.log('\n✅ Column content_en already exists!\n')
    }
  } catch (err) {
    console.error('Error:', err.message)
  }

  process.exit(0)
}

addEnglishColumn()
