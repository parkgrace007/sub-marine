import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check frontend/.env')
}

// Create Supabase client with ANON key (read-only + auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionUrl: true,
    flowType: 'implicit' // Fixed: Use implicit flow to avoid PKCE race condition blocking queries
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Test Supabase connection on initialization
if (import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true') {
  // Only test in development to avoid production console spam
  supabase.from('whale_events').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.error('❌ Supabase connection test FAILED:', error.message)
        console.error('   URL:', supabaseUrl)
        console.error('   Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING')
      } else {
        console.log('✅ Supabase connection test PASSED')
        console.log(`   Connected to: ${supabaseUrl}`)
        console.log(`   whale_events table has ${count} rows`)
      }
    })
    .catch(err => {
      console.error('❌ Supabase connection test ERROR:', err)
    })
}

export default supabase
