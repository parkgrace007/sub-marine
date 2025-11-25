import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check frontend/.env')
}

// Create Supabase client with ANON key (for AUTH ONLY)
// NOTE: Do NOT use supabase client for data queries - use Backend API instead
// Reason: Render Free Tier has connection issues with direct Supabase calls
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionUrl: true,
    flowType: 'implicit' // Use implicit flow for OAuth
  },
  // Disable realtime since we use Backend SSE instead
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
