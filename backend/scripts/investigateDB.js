import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function investigate() {
  console.log('\n=== Whale Events DB 상태 보고 ===\n')

  try {
    // 1. 최근 10개 거래 조회
    console.log('📊 최근 10개 거래:')
    const { data: recent, error: recentError } = await supabase
      .from('whale_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10)

    if (recentError) throw recentError

    if (!recent || recent.length === 0) {
      console.log('⚠️  DB에 거래 데이터가 없습니다!')
    } else {
      recent.forEach((tx, idx) => {
        const time = new Date(tx.timestamp * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        const amount = (tx.amount_usd / 1000000).toFixed(2)
        console.log(`${idx + 1}. [${time}] ${tx.flow_type} $${amount}M ${tx.symbol} (${tx.from_owner || 'unknown'} → ${tx.to_owner || 'unknown'})`)
      })
    }

    // 2. 24시간 통계
    console.log('\n📈 24시간 통계:')
    const now = Math.floor(Date.now() / 1000)
    const yesterday = now - (24 * 60 * 60)

    const { data: stats24h, error: statsError } = await supabase
      .from('whale_events')
      .select('flow_type')
      .gte('timestamp', yesterday)

    if (statsError) throw statsError

    const total = stats24h?.length || 0
    const inflow = stats24h?.filter(tx => tx.flow_type === 'inflow').length || 0
    const outflow = stats24h?.filter(tx => tx.flow_type === 'outflow').length || 0
    const exchange = stats24h?.filter(tx => tx.flow_type === 'exchange').length || 0
    const internal = stats24h?.filter(tx => tx.flow_type === 'internal').length || 0
    const defi = stats24h?.filter(tx => tx.flow_type === 'defi').length || 0

    console.log(`- Total: ${total}건`)
    console.log(`- Inflow: ${inflow}건 (${total ? ((inflow / total) * 100).toFixed(1) : 0}%)`)
    console.log(`- Outflow: ${outflow}건 (${total ? ((outflow / total) * 100).toFixed(1) : 0}%)`)
    console.log(`- Exchange: ${exchange}건 (${total ? ((exchange / total) * 100).toFixed(1) : 0}%)`)
    console.log(`- Internal: ${internal}건 (${total ? ((internal / total) * 100).toFixed(1) : 0}%)`)
    console.log(`- DeFi: ${defi}건 (${total ? ((defi / total) * 100).toFixed(1) : 0}%)`)

    // 3. 마지막 inflow/outflow 거래 시간 (2025-11-23: flow type terminology)
    console.log('\n⏰ 마지막 거래:')

    const { data: lastInflow, error: inflowError } = await supabase
      .from('whale_events')
      .select('timestamp, symbol, amount_usd, from_owner, to_owner')
      .eq('flow_type', 'inflow')
      .order('timestamp', { ascending: false })
      .limit(1)

    if (inflowError) throw inflowError

    const { data: lastOutflow, error: outflowError } = await supabase
      .from('whale_events')
      .select('timestamp, symbol, amount_usd, from_owner, to_owner')
      .eq('flow_type', 'outflow')
      .order('timestamp', { ascending: false })
      .limit(1)

    if (outflowError) throw outflowError

    if (lastInflow && lastInflow.length > 0) {
      const time = new Date(lastInflow[0].timestamp * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      const amount = (lastInflow[0].amount_usd / 1000000).toFixed(2)
      console.log(`- 마지막 inflow: [${time}] $${amount}M ${lastInflow[0].symbol} (${lastInflow[0].from_owner || 'unknown'} → ${lastInflow[0].to_owner || 'unknown'})`)
    } else {
      console.log('- 마지막 inflow: ❌ 없음')
    }

    if (lastOutflow && lastOutflow.length > 0) {
      const time = new Date(lastOutflow[0].timestamp * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      const amount = (lastOutflow[0].amount_usd / 1000000).toFixed(2)
      console.log(`- 마지막 outflow: [${time}] $${amount}M ${lastOutflow[0].symbol} (${lastOutflow[0].from_owner || 'unknown'} → ${lastOutflow[0].to_owner || 'unknown'})`)
    } else {
      console.log('- 마지막 outflow: ❌ 없음')
    }

    // 4. 오늘 vs 어제 비교
    console.log('\n📅 시간대별 비교:')
    const koreaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
    const todayKorea = new Date(koreaTime)
    todayKorea.setHours(0, 0, 0, 0)
    const yesterdayKorea = new Date(todayKorea.getTime() - 24 * 60 * 60 * 1000)

    const todayTimestamp = Math.floor(todayKorea.getTime() / 1000)
    const yesterdayTimestamp = Math.floor(yesterdayKorea.getTime() / 1000)

    const { data: todayData, error: todayError } = await supabase
      .from('whale_events')
      .select('flow_type')
      .gte('timestamp', todayTimestamp)

    if (todayError) throw todayError

    const { data: yesterdayData, error: yesterdayError } = await supabase
      .from('whale_events')
      .select('flow_type')
      .gte('timestamp', yesterdayTimestamp)
      .lt('timestamp', todayTimestamp)

    if (yesterdayError) throw yesterdayError

    const todayTotal = todayData?.length || 0
    const todayBuy = todayData?.filter(tx => tx.flow_type === 'buy').length || 0
    const todaySell = todayData?.filter(tx => tx.flow_type === 'sell').length || 0

    const yesterdayTotal = yesterdayData?.length || 0
    const yesterdayBuy = yesterdayData?.filter(tx => tx.flow_type === 'buy').length || 0
    const yesterdaySell = yesterdayData?.filter(tx => tx.flow_type === 'sell').length || 0

    console.log(`오늘 (${todayKorea.toLocaleDateString('ko-KR')}):`)
    console.log(`  - Total: ${todayTotal}건 | Buy: ${todayBuy}건 | Sell: ${todaySell}건`)
    console.log(`어제 (${yesterdayKorea.toLocaleDateString('ko-KR')}):`)
    console.log(`  - Total: ${yesterdayTotal}건 | Buy: ${yesterdayBuy}건 | Sell: ${yesterdaySell}건`)

    // 5. 전체 테이블 통계
    console.log('\n📊 전체 DB 통계:')
    const { count: totalCount, error: countError } = await supabase
      .from('whale_events')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    console.log(`- 전체 레코드 수: ${totalCount}건`)

    // 6. flow_type별 전체 통계
    console.log('\n📊 전체 flow_type 분포:')
    const { data: allFlowTypes, error: flowError } = await supabase
      .from('whale_events')
      .select('flow_type')

    if (flowError) throw flowError

    const allTotal = allFlowTypes?.length || 0
    const allBuy = allFlowTypes?.filter(tx => tx.flow_type === 'buy').length || 0
    const allSell = allFlowTypes?.filter(tx => tx.flow_type === 'sell').length || 0
    const allExchange = allFlowTypes?.filter(tx => tx.flow_type === 'exchange').length || 0
    const allInternal = allFlowTypes?.filter(tx => tx.flow_type === 'internal').length || 0
    const allDefi = allFlowTypes?.filter(tx => tx.flow_type === 'defi').length || 0

    console.log(`- Buy: ${allBuy}건 (${allTotal ? ((allBuy / allTotal) * 100).toFixed(1) : 0}%)`)
    console.log(`- Sell: ${allSell}건 (${allTotal ? ((allSell / allTotal) * 100).toFixed(1) : 0}%)`)
    console.log(`- Exchange: ${allExchange}건 (${allTotal ? ((allExchange / allTotal) * 100).toFixed(1) : 0}%)`)
    console.log(`- Internal: ${allInternal}건 (${allTotal ? ((allInternal / allTotal) * 100).toFixed(1) : 0}%)`)
    console.log(`- DeFi: ${allDefi}건 (${allTotal ? ((allDefi / allTotal) * 100).toFixed(1) : 0}%)`)

    // 7. 문제 진단
    console.log('\n🔍 문제 진단:')
    const nowSeconds = Math.floor(Date.now() / 1000)
    const timeSinceLastBuy = lastBuy?.[0] ? Math.floor((nowSeconds - lastBuy[0].timestamp) / 60) : null
    const timeSinceLastSell = lastSell?.[0] ? Math.floor((nowSeconds - lastSell[0].timestamp) / 60) : null

    if (!lastBuy?.[0] && !lastSell?.[0]) {
      console.log('❌ CRITICAL: buy/sell 거래가 전혀 없습니다!')
      console.log('→ Whale Alert WebSocket 또는 flow_type 분류 로직 점검 필요')
    } else if (timeSinceLastBuy > 60 || timeSinceLastSell > 60) {
      console.log(`⚠️  WARNING: 마지막 buy/sell 거래가 1시간 이상 경과했습니다.`)
      console.log(`   - 마지막 buy: ${timeSinceLastBuy}분 전`)
      console.log(`   - 마지막 sell: ${timeSinceLastSell}분 전`)
      console.log('→ 실시간 데이터 수신 또는 저장 로직 점검 필요')
    } else {
      console.log('✅ buy/sell 거래가 정상적으로 저장되고 있습니다.')
      console.log(`   - 마지막 buy: ${timeSinceLastBuy}분 전`)
      console.log(`   - 마지막 sell: ${timeSinceLastSell}분 전`)
    }

    if (todayBuy === 0 && todaySell === 0 && yesterdayBuy > 0 && yesterdaySell > 0) {
      console.log('\n⚠️  오늘 00시 이후 buy/sell이 전혀 저장되지 않았습니다!')
      console.log('→ 백엔드 재시작 또는 WebSocket 재연결 필요')
    }

    // 8. 시간대별 상세 분석
    console.log('\n⏱️  시간대별 상세 분석:')
    const oneHourAgo = nowSeconds - 3600
    const threeHoursAgo = nowSeconds - (3 * 3600)
    const sixHoursAgo = nowSeconds - (6 * 3600)

    const { data: last1h, error: e1h } = await supabase
      .from('whale_events')
      .select('flow_type')
      .gte('timestamp', oneHourAgo)

    const { data: last3h, error: e3h } = await supabase
      .from('whale_events')
      .select('flow_type')
      .gte('timestamp', threeHoursAgo)

    const { data: last6h, error: e6h } = await supabase
      .from('whale_events')
      .select('flow_type')
      .gte('timestamp', sixHoursAgo)

    if (!e1h && !e3h && !e6h) {
      const h1Buy = last1h?.filter(tx => tx.flow_type === 'buy').length || 0
      const h1Sell = last1h?.filter(tx => tx.flow_type === 'sell').length || 0
      const h3Buy = last3h?.filter(tx => tx.flow_type === 'buy').length || 0
      const h3Sell = last3h?.filter(tx => tx.flow_type === 'sell').length || 0
      const h6Buy = last6h?.filter(tx => tx.flow_type === 'buy').length || 0
      const h6Sell = last6h?.filter(tx => tx.flow_type === 'sell').length || 0

      console.log(`최근 1시간: Buy ${h1Buy}건 | Sell ${h1Sell}건`)
      console.log(`최근 3시간: Buy ${h3Buy}건 | Sell ${h3Sell}건`)
      console.log(`최근 6시간: Buy ${h6Buy}건 | Sell ${h6Sell}건`)
    }

  } catch (error) {
    console.error('\n❌ 조사 중 오류 발생:', error.message)
    console.error(error)
  }
}

investigate()
