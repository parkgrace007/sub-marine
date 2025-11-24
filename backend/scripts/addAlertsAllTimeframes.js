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
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addAlertsAllTimeframes() {
  console.log('\n📊 Adding test alerts for all timeframes and symbols...\n')

  const timeframes = ['1h', '4h', '1d']
  const symbols = ['통합', 'BTC', 'ETH']

  const alertTypes = [
    { type: 'critical', messages: [
      'RSI 과매도 구간 진입',
      '급격한 가격 하락 감지',
      '거래량 급증 경고'
    ]},
    { type: 'warning', messages: [
      'MACD 하락 크로스오버 감지',
      '단기 하락 압력 증가',
      'BB 하단 밴드 근접'
    ]},
    { type: 'info', messages: [
      '시장 변동성 증가',
      '거래량 패턴 변화 감지',
      '기술적 지표 재조정'
    ]},
    { type: 'success', messages: [
      '시장 심리 개선',
      '매수 신호 포착',
      '상승 모멘텀 확인'
    ]}
  ]

  let totalInserted = 0

  for (const timeframe of timeframes) {
    for (const symbol of symbols) {
      console.log(`\n📝 Creating alerts for ${timeframe}/${symbol}...`)

      // Add 3-5 alerts per combination
      const numAlerts = 3 + Math.floor(Math.random() * 3)

      for (let i = 0; i < numAlerts; i++) {
        const typeIndex = Math.floor(Math.random() * alertTypes.length)
        const selectedType = alertTypes[typeIndex]
        const messageIndex = Math.floor(Math.random() * selectedType.messages.length)
        const baseMessage = selectedType.messages[messageIndex]

        // Add some variation to messages
        const variations = [
          `${baseMessage} (${Math.floor(20 + Math.random() * 60)})`,
          `${baseMessage} - ${timeframe} 차트 분석`,
          `${baseMessage} 확인됨`
        ]
        const message = variations[Math.floor(Math.random() * variations.length)]

        const alert = {
          timeframe,
          symbol,
          type: selectedType.type,
          message
        }

        const { data, error } = await supabase
          .from('indicator_alerts')
          .insert(alert)
          .select()
          .single()

        if (error) {
          console.error(`   ❌ Failed to insert alert:`, error.message)
        } else {
          console.log(`   ✅ [${selectedType.type.toUpperCase()}] ${message}`)
          totalInserted++
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Successfully inserted ${totalInserted} alerts across all timeframes and symbols!`)
  console.log('='.repeat(60) + '\n')

  // Show summary
  console.log('\n📊 Summary by timeframe/symbol:')
  for (const timeframe of timeframes) {
    for (const symbol of symbols) {
      const { count, error } = await supabase
        .from('indicator_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('timeframe', timeframe)
        .eq('symbol', symbol)

      if (!error) {
        console.log(`   ${timeframe}/${symbol}: ${count} alerts`)
      }
    }
  }

  process.exit(0)
}

addAlertsAllTimeframes()
