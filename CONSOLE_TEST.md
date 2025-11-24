# 🔍 브라우저 콘솔 직접 테스트

Render 배포 완료 후, 브라우저에서 다음을 실행해주세요:

## Step 1: 진단 로그 확인

**기대되는 로그 (새 버전)**:
```
🔍 [DIAGNOSTIC] Starting fetchWhales...
   Timeframe: 8h, Symbol: 통합, FlowTypes: inflow,outflow
   Fetch window: 57600000ms, Cutoff timestamp: 1732345678
🔍 [DIAGNOSTIC] Building Supabase query...
   Applied flow_type filter: inflow, outflow
   Query limit: 500
🔍 [DIAGNOSTIC] Executing query with 30s timeout...
⚠️ DIAGNOSTIC MODE: Realtime subscription DISABLED
```

**만약 이 로그가 없고 이전 로그만 나온다면**:
```
✅ Loaded whale sprite tier2: 150×150
...
Realtime subscription status: TIMED_OUT
```

→ **빌드 캐시 문제**입니다! Render Dashboard에서 "Clear build cache & deploy" 필수!

---

## Step 2: 직접 Supabase 쿼리 테스트

**브라우저 콘솔 (F12)에 다음 코드 붙여넣기**:

```javascript
// Test 1: Supabase REST API 직접 호출
const testSupabaseQuery = async () => {
  console.log('🧪 Starting direct Supabase query test...')

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

  console.log('   URL:', SUPABASE_URL)
  console.log('   ANON_KEY:', ANON_KEY ? 'Present ✅' : 'Missing ❌')

  // Calculate cutoff (last 16 hours = 8h timeframe × 2 buffer)
  const cutoffTimestamp = Math.floor((Date.now() - (8 * 3600 * 1000 * 2)) / 1000)
  console.log('   Cutoff timestamp:', cutoffTimestamp)
  console.log('   Cutoff date:', new Date(cutoffTimestamp * 1000).toISOString())

  // Build query URL
  const queryParams = new URLSearchParams({
    select: 'id,timestamp,symbol,amount_usd,flow_type',
    timestamp: `gte.${cutoffTimestamp}`,
    amount_usd: 'gte.10000000',
    flow_type: 'in.(inflow,outflow)',
    order: 'timestamp.desc',
    limit: '500'
  })

  const url = `${SUPABASE_URL}/rest/v1/whale_events?${queryParams}`
  console.log('   Query URL:', url)

  const startTime = Date.now()

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const duration = Date.now() - startTime
    console.log(`✅ Response received in ${duration}ms`)
    console.log('   Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ HTTP Error:', errorText)
      return
    }

    const data = await response.json()
    console.log(`✅ Query succeeded!`)
    console.log(`   Records received: ${data.length}`)
    console.log(`   Total time: ${duration}ms`)

    if (data.length > 0) {
      console.log('   Sample record:', data[0])
      console.log('   Latest timestamp:', new Date(data[0].timestamp * 1000).toISOString())
    } else {
      console.warn('⚠️  No records found in time range!')
      console.log('   This could mean:')
      console.log('   1. No whale transactions in last 16 hours')
      console.log('   2. All transactions filtered out by flow_type or amount_usd')
    }

    // Test 2: Query WITHOUT filters to see if ANY data exists
    console.log('\n🧪 Test 2: Query without filters...')
    const test2Url = `${SUPABASE_URL}/rest/v1/whale_events?select=id,timestamp&order=timestamp.desc&limit=10`
    const test2Response = await fetch(test2Url, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    })
    const test2Data = await test2Response.json()
    console.log(`   Total records in DB: ${test2Data.length > 0 ? 'At least ' + test2Data.length : '0'}`)
    if (test2Data.length > 0) {
      console.log('   Latest record timestamp:', new Date(test2Data[0].timestamp * 1000).toISOString())
      console.log('   Age:', Math.floor((Date.now() / 1000 - test2Data[0].timestamp) / 3600), 'hours old')
    }

    return data
  } catch (err) {
    const duration = Date.now() - startTime
    console.error(`❌ Query failed after ${duration}ms:`, err)
    console.error('   Error name:', err.name)
    console.error('   Error message:', err.message)
  }
}

// Execute test
testSupabaseQuery()
```

---

## 예상 결과

### ✅ Case A: REST API 성공 (데이터 있음)
```
✅ Response received in 234ms
   Status: 200
✅ Query succeeded!
   Records received: 123
   Sample record: {...}
```

**→ 문제**: Frontend 코드 또는 빌드 캐시
**→ 해결**: Clear build cache & deploy

---

### ⚠️ Case B: REST API 성공 (데이터 없음)
```
✅ Response received in 234ms
   Status: 200
✅ Query succeeded!
   Records received: 0
⚠️  No records found in time range!

🧪 Test 2: Query without filters...
   Total records in DB: 10
   Latest record timestamp: 2025-11-20T12:00:00Z
   Age: 72 hours old
```

**→ 문제**: Backend가 최근 데이터를 수집하지 못함
**→ 해결**: Backend 재시작 또는 Whale Alert API 확인

---

### ❌ Case C: REST API 타임아웃
```
❌ Query failed after 30000ms: Error: Failed to fetch
```

**→ 문제**: Supabase 연결 자체 실패
**→ 해결**: Supabase 프로젝트 Resume 또는 환경변수 확인

---

## 🚨 즉시 확인 요청

1. **Render Dashboard 확인**:
   - Frontend Service → "Events" 탭
   - 최신 Deploy 상태: "Live" 인지?
   - Deploy 시간: 몇 분 전인지?

2. **브라우저 Hard Reload**:
   - Mac: Cmd + Shift + R
   - Windows: Ctrl + Shift + F5

3. **콘솔 로그 확인**:
   - `🔍 [DIAGNOSTIC]` 로그가 있는지?
   - 있으면 → 전체 로그 공유
   - 없으면 → 빌드 캐시 문제

4. **위 테스트 스크립트 실행**:
   - 결과 공유

---

위 정보를 공유해주시면 정확한 원인을 찾을 수 있습니다!
