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

export default supabase
