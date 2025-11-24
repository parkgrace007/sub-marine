import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * Create translated_news table in Supabase
 * This table stores translated news articles to avoid re-translation
 */
async function createNewsTable() {
  console.log('📊 Creating translated_news table...')

  try {
    // Drop existing table if it exists
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS translated_news CASCADE;'
    })

    if (dropError && !dropError.message.includes('does not exist')) {
      console.log('⚠️  Note:', dropError.message)
    }

    // Create table with SQL
    const createTableSQL = `
      CREATE TABLE translated_news (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        title_en TEXT,
        body_en TEXT,
        publisher_name TEXT,
        image TEXT,
        author TEXT,
        tags JSONB DEFAULT '[]'::jsonb,
        read_time INTEGER DEFAULT 0,
        published_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create index on URL for fast lookup
      CREATE UNIQUE INDEX idx_translated_news_url ON translated_news(url);

      -- Create index on published_at for sorting
      CREATE INDEX idx_translated_news_published_at ON translated_news(published_at DESC);

      -- Create index on created_at for cleanup
      CREATE INDEX idx_translated_news_created_at ON translated_news(created_at DESC);
    `

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (createError) {
      throw createError
    }

    console.log('✅ Table created successfully!')

    // Verify table exists
    const { data, error: selectError } = await supabase
      .from('translated_news')
      .select('*')
      .limit(1)

    if (selectError) {
      throw selectError
    }

    console.log('✅ Table verified - ready to use')
    console.log('')
    console.log('📋 Table structure:')
    console.log('  - id (UUID, primary key)')
    console.log('  - url (TEXT, unique)')
    console.log('  - title (TEXT) - Korean')
    console.log('  - body (TEXT) - Korean')
    console.log('  - title_en (TEXT) - English original')
    console.log('  - body_en (TEXT) - English original')
    console.log('  - publisher_name (TEXT)')
    console.log('  - image (TEXT)')
    console.log('  - author (TEXT)')
    console.log('  - tags (JSONB)')
    console.log('  - read_time (INTEGER)')
    console.log('  - published_at (TIMESTAMP)')
    console.log('  - created_at (TIMESTAMP)')
    console.log('  - updated_at (TIMESTAMP)')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating table:', error.message)
    console.error('')
    console.error('💡 Try creating the table manually in Supabase SQL Editor:')
    console.error('   https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new')
    console.error('')
    console.error('SQL to run:')
    console.error(`
CREATE TABLE translated_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  title_en TEXT,
  body_en TEXT,
  publisher_name TEXT,
  image TEXT,
  author TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  read_time INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_translated_news_url ON translated_news(url);
CREATE INDEX idx_translated_news_published_at ON translated_news(published_at DESC);
CREATE INDEX idx_translated_news_created_at ON translated_news(created_at DESC);
    `)
    process.exit(1)
  }
}

createNewsTable()
