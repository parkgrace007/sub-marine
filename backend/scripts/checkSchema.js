import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function checkSchema() {
  const { data, error } = await supabase
    .from('whale_events')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Sample record:', JSON.stringify(data[0], null, 2))
  }
}

checkSchema()
