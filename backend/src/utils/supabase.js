import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables. Check backend/.env')
}

// Create Supabase client with SERVICE_ROLE key (has write permissions)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to test connection
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('whale_events')
      .select('count')
      .limit(1)

    if (error) throw error

    console.log('✅ Backend Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Backend Supabase connection failed:', error.message)
    return false
  }
}

export default supabase
