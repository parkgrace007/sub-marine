import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('L Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testIndicatorAlerts() {
  console.log('\n>ê Testing Indicator Alerts System')
  console.log('='.repeat(60))

  try {
    // Test 1: Insert sample alerts
    console.log('\n=Ý Test 1: Inserting sample alerts...')

    const sampleAlerts = [
      {
        timeframe: '1h',
        symbol: 'BTC',
        type: 'critical',
        message: 'RSI oversold at 25.3'
      },
      {
        timeframe: '1h',
        symbol: 'BTC',
        type: 'warning',
        message: 'MACD bearish crossover detected'
      },
      {
        timeframe: '1h',
        symbol: 'ETH',
        type: 'info',
        message: 'Price approaching BB lower band'
      },
      {
        timeframe: '4h',
        symbol: 'µi',
        type: 'success',
        message: 'Market sentiment improving'
      }
    ]

    for (const alert of sampleAlerts) {
      const { data, error } = await supabase
        .from('indicator_alerts')
        .insert(alert)
        .select()
        .single()

      if (error) {
        console.error('   L Failed to insert:', alert.message)
        console.error('      Error:', error.message)
      } else {
        console.log('    Inserted:', alert.message, `(${data.id})`)
      }
    }

    // Test 2: Query alerts by timeframe/symbol
    console.log('\n=å Test 2: Querying alerts for 1h/BTC...')

    const { data: btcAlerts, error: queryError } = await supabase
      .from('indicator_alerts')
      .select('*')
      .eq('timeframe', '1h')
      .eq('symbol', 'BTC')
      .order('created_at', { ascending: false })
      .limit(100)

    if (queryError) {
      console.error('   L Query failed:', queryError.message)
    } else {
      console.log(`    Found ${btcAlerts.length} alerts:`)
      btcAlerts.forEach(alert => {
        const typeUpper = alert.type.toUpperCase()
        console.log(`      - [${typeUpper}] ${alert.message}`)
      })
    }

    // Test 3: Check auto-cleanup (insert 105 alerts, should keep only 100)
    console.log('\n>ù Test 3: Testing auto-cleanup (inserting 105 alerts)...')

    const bulkAlerts = Array.from({ length: 105 }, (_, i) => ({
      timeframe: '1h',
      symbol: 'TEST',
      type: 'info',
      message: `Test alert ${i + 1}`
    }))

    const { data: bulkData, error: bulkError } = await supabase
      .from('indicator_alerts')
      .insert(bulkAlerts)

    if (bulkError) {
      console.error('   L Bulk insert failed:', bulkError.message)
    } else {
      console.log('    Inserted 105 alerts')
    }

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Count remaining alerts
    const { count, error: countError } = await supabase
      .from('indicator_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('timeframe', '1h')
      .eq('symbol', 'TEST')

    if (countError) {
      console.error('   L Count failed:', countError.message)
    } else {
      if (count <= 100) {
        console.log(`    Auto-cleanup working! Kept ${count}/105 alerts (max 100)`)
      } else {
        console.log(`      Warning: Found ${count} alerts (expected d100)`)
      }
    }

    // Test 4: Cleanup test data
    console.log('\n=Ñ  Test 4: Cleaning up test data...')

    const { error: deleteError } = await supabase
      .from('indicator_alerts')
      .delete()
      .eq('symbol', 'TEST')

    if (deleteError) {
      console.error('   L Cleanup failed:', deleteError.message)
    } else {
      console.log('    Test data cleaned up')
    }

    console.log('\n' + '='.repeat(60))
    console.log(' All tests completed!\n')

  } catch (error) {
    console.error('\nL Test failed:', error.message)
    console.error(error)
  }

  process.exit(0)
}

testIndicatorAlerts()
