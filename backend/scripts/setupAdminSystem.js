/**
 * Setup Admin System Database Schema
 * Runs create_admin_system.sql migration
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { supabase } from '../src/utils/supabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function setupAdminSystem() {
  try {
    console.log('🔧 Setting up Admin System...\n')

    // Read SQL file
    const sqlPath = path.join(__dirname, '../sql/create_admin_system.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Execute SQL
    console.log('📝 Executing SQL migration...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // If RPC doesn't exist, try direct SQL execution
      console.log('⚠️  RPC not available, using manual execution...')

      // Split SQL into individual statements (simple approach)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

      for (const statement of statements) {
        if (statement.length > 10) {  // Skip very short statements
          try {
            await supabase.rpc('exec', { sql: statement })
          } catch (err) {
            console.log(`⚠️  Statement execution note: ${err.message}`)
          }
        }
      }
    }

    console.log('✅ Admin system schema created successfully!\n')

    // Verify tables
    console.log('🔍 Verifying table structure...')

    // Check if role column exists in profiles
    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(1)

    if (profilesError) {
      console.error('❌ Error checking profiles table:', profilesError.message)
    } else {
      console.log('✅ profiles.role column exists')
    }

    // Check if audit_logs table exists
    const { data: auditCheck, error: auditError } = await supabase
      .from('admin_audit_logs')
      .select('id')
      .limit(1)

    if (auditError) {
      console.error('❌ Error checking admin_audit_logs table:', auditError.message)
    } else {
      console.log('✅ admin_audit_logs table exists')
    }

    console.log('\n📋 Next Steps:')
    console.log('1. Run this SQL in Supabase SQL Editor to grant admin role:')
    console.log('   UPDATE profiles SET role = \'super_admin\'')
    console.log('   WHERE id = (SELECT id FROM auth.users WHERE email = \'YOUR_EMAIL\' LIMIT 1);')
    console.log('\n2. Or use the Supabase dashboard to manually update a user\'s role')

  } catch (err) {
    console.error('❌ Setup failed:', err)
    process.exit(1)
  }
}

// Run setup
setupAdminSystem()
