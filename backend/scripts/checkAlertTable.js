import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log('Checking indicator_alerts table...\n')
  
  const { data, error } = await supabase
    .from('indicator_alerts')
    .select('*')
    .limit(5)
  
  if (error) {
    console.error('❌ Error:', error.message)
    console.error('   Code:', error.code)
    console.error('\n   Possible causes:')
    console.error('   1. Table does not exist')
    console.error('   2. SQL not executed in Supabase')
  } else {
    console.log('✅ Table exists! Found', data.length, 'alerts')
    if (data.length > 0) {
      console.log('\n   Sample:', data[0])
    }
  }
  
  process.exit(0)
}

check()
