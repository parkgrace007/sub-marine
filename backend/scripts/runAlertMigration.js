#!/usr/bin/env node
/**
 * Run migration to create alert system tables
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function runMigration() {
  console.log('🚀 Starting ALERT_System database migration...\n')

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '../migrations/create_alert_tables.sql')
    const sqlContent = await fs.readFile(sqlPath, 'utf-8')

    // Split by semicolon and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)

      // Use raw SQL execution through Supabase
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      }).single()

      if (error && !error.message?.includes('already exists')) {
        console.error(`❌ Error executing statement ${i + 1}:`, error)
        // Continue with other statements even if one fails
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }

    console.log('\n✨ Migration completed successfully!')

    // Verify tables were created
    console.log('\n🔍 Verifying tables...')

    const tables = ['candle_history', 'alerts', 'alert_history']
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ Table ${table}: NOT FOUND`)
      } else {
        console.log(`✅ Table ${table}: EXISTS (${count || 0} rows)`)
      }
    }

    console.log('\n🎉 ALERT_System database setup complete!')
    process.exit(0)

  } catch (error) {
    console.error('❌ Fatal error during migration:', error)
    process.exit(1)
  }
}

// Alternative approach if exec_sql RPC doesn't exist
async function runMigrationAlternative() {
  console.log('🚀 Starting ALERT_System database migration (Alternative method)...\n')

  try {
    // Since we can't run raw SQL directly, we'll check if tables exist
    // and provide instructions for manual creation

    console.log('⚠️  Note: Direct SQL execution not available.')
    console.log('📋 Please run the following SQL in your Supabase dashboard:\n')

    const sqlPath = path.join(__dirname, '../migrations/create_alert_tables.sql')
    const sqlContent = await fs.readFile(sqlPath, 'utf-8')

    console.log('```sql')
    console.log(sqlContent)
    console.log('```\n')

    console.log('🔗 Go to: https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new')
    console.log('📝 Paste the SQL above and click "Run"\n')

    // Check if tables already exist
    console.log('🔍 Checking current table status...\n')

    const tables = ['candle_history', 'alerts', 'alert_history']
    let allExist = true

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error && error.code === '42P01') {
        console.log(`❌ Table ${table}: NOT EXISTS`)
        allExist = false
      } else if (error) {
        console.log(`⚠️  Table ${table}: Cannot verify (${error.message})`)
        allExist = false
      } else {
        console.log(`✅ Table ${table}: EXISTS`)
      }
    }

    if (allExist) {
      console.log('\n✅ All tables already exist! Migration complete.')
    } else {
      console.log('\n⚠️  Some tables are missing. Please create them using the SQL above.')
    }

    process.exit(0)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Try the alternative method since Supabase doesn't support exec_sql directly
runMigrationAlternative().catch(console.error)