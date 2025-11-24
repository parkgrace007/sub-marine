import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addTestAlerts() {
  console.log('\n📝 Adding test alerts for 1h/통합...\n')
  
  const testAlerts = [
    {
      timeframe: '1h',
      symbol: '통합',
      type: 'critical',
      message: 'RSI 과매도 구간 진입 (28.5)'
    },
    {
      timeframe: '1h',
      symbol: '통합',
      type: 'warning',
      message: 'MACD 하락 크로스오버 감지'
    },
    {
      timeframe: '1h',
      symbol: '통합',
      type: 'info',
      message: 'BB 하단 밴드 근접 ($95,234)'
    },
    {
      timeframe: '1h',
      symbol: '통합',
      type: 'success',
      message: '시장 심리 개선 (Bull Ratio 0.62)'
    }
  ]
  
  for (const alert of testAlerts) {
    const { data, error } = await supabase
      .from('indicator_alerts')
      .insert(alert)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log(`✅ Added: ${alert.message}`)
    }
  }
  
  console.log('\n✅ Test alerts added! Refresh browser to see them.\n')
  process.exit(0)
}

addTestAlerts()
