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

async function addAlert() {
  const alertTypes = [
    { type: 'critical', message: '⚠️ 급격한 가격 하락 감지! RSI 20 이하 과매도 경고' },
    { type: 'warning', message: '📊 MACD 히스토그램 음전환, 단기 하락 압력 증가 중' },
    { type: 'info', message: '💡 볼린저 밴드 하단 접촉, 반등 가능성 주목' },
    { type: 'success', message: '✅ 거래량 급증 포착! 시장 관심도 상승 신호' }
  ]
  
  const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
  
  const newAlert = {
    timeframe: '1h',
    symbol: '통합',
    type: randomAlert.type,
    message: randomAlert.message
  }
  
  console.log('\n📝 Adding new alert with typing effect...')
  console.log(`   Type: ${newAlert.type}`)
  console.log(`   Message: ${newAlert.message}`)
  
  const { data, error } = await supabase
    .from('indicator_alerts')
    .insert(newAlert)
    .select()
    .single()
  
  if (error) {
    console.error('\n❌ Error:', error.message)
  } else {
    console.log('\n✅ Alert added! Watch the typing effect in browser!')
    console.log(`   ID: ${data.id}\n`)
  }
  
  process.exit(0)
}

addAlert()
