import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check frontend/.env')
}

// Create Supabase client with ANON key
// Used for:
// - Authentication (supabase.auth.*)
// - Realtime subscriptions (whale_events, indicator_alerts)
// Data queries still use Backend API for caching + SERVICE_ROLE access
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionUrl: true,
    flowType: 'implicit' // Use implicit flow for OAuth
  },
  // Enable Realtime with optimized settings (2025-11-25)
  // Supabase Pro now active - direct Realtime connection is stable
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Log configuration (no direct DB query - that would timeout on Render Free Tier)
console.log('🔐 Supabase Auth client initialized')
console.log('   URL:', supabaseUrl)
console.log('   Mode:', import.meta.env.MODE)

export default supabase
