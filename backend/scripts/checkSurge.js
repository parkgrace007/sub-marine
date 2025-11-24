import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function checkSurgeConditions() {
  const tenMinutesAgo = Math.floor((Date.now() - 10 * 60 * 1000) / 1000)

  const { data, error } = await supabase
    .from('whale_events')
    .select('*')
    .gte('timestamp', tenMinutesAgo)
    .gte('amount_usd', 100000000)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`\n🔍 Checking S-001 WHALE_SURGE conditions...`)
  console.log(`   Time window: Last 10 minutes`)
  console.log(`   Threshold: $100M+ per whale`)
  console.log(`   Required: 3+ whales\n`)

  console.log(`Found ${data.length} whales ≥$100M in last 10 minutes:`)

  if (data.length > 0) {
    data.slice(0, 10).forEach((w, i) => {
      const time = new Date(w.timestamp * 1000).toISOString()
      console.log(`  ${i+1}. ${w.flow_type.padEnd(8)} - $${(w.amount_usd / 1e6).toFixed(1).padStart(6)}M ${w.symbol.padEnd(6)} - ${time}`)
    })
  } else {
    console.log('  (none)')
  }

  console.log('')

  if (data.length >= 3) {
    const totalVolume = data.reduce((sum, w) => sum + w.amount_usd, 0)
    console.log('✅ SURGE CONDITION MET!')
    console.log(`   Whale count: ${data.length}`)
    console.log(`   Total volume: $${(totalVolume / 1e9).toFixed(2)}B`)
    console.log(`   → S-001 alert should trigger on next scheduler run`)
  } else {
    console.log(`❌ Surge condition NOT met`)
    console.log(`   Need 3 whales, found ${data.length}`)
    console.log(`   → S-001 will not trigger`)
  }

  process.exit(0)
}

checkSurgeConditions().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
