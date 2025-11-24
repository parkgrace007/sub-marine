# 🔍 Production Timeout Diagnostic Plan (2025-11-24)

## 현재 상황 Summary

### ✅ 완료된 최적화
1. **Database Query**: 2.458ms (매우 빠름)
2. **Indexes**: 10개 생성 완료
3. **RLS Policies**: 40+ 중복 제거 완료
4. **Query Optimization**:
   - flow_type 필터 (70% 데이터 감소)
   - Column selection (40% 데이터 감소)
   - Query limit 축소 (500/100)
5. **Timeout**: 10초 → 30초 증가

### ❌ 여전히 발생하는 문제
- **Production (Render)**: 30초 타임아웃 발생
- **Local**: 정상 작동
- **DB 성능**: 2.5ms (문제 없음)

### 💡 Critical Insight
**DB는 빠른데 Frontend가 타임아웃** → 문제는 **PostgREST API** 또는 **Realtime WebSocket** 레이어

---

## 🎯 Diagnostic Test #1: Realtime Isolation Test

### 목적
Realtime WebSocket이 타임아웃 원인인지 확인

### 변경사항
- `frontend/src/hooks/useWhaleData.js`에서 Realtime subscription 비활성화
- 상세 로깅 추가 (query 시작/완료 시간, 데이터 크기)

### 테스트 방법

#### 1. Frontend 재배포 (Render)
```bash
cd frontend
npm run build
git add .
git commit -m "test: Diagnostic - Realtime disabled"
git push origin main
```

Render Dashboard에서 자동 배포 완료 대기 (5-10분)

#### 2. 브라우저에서 테스트
1. Render 배포 URL 접속: `https://submarine-xxx.onrender.com`
2. **브라우저 개발자 도구 콘솔 열기** (F12)
3. 로그 확인:
   ```
   🔍 [DIAGNOSTIC] Starting fetchWhales...
   🔍 [DIAGNOSTIC] Building Supabase query...
   🔍 [DIAGNOSTIC] Executing query with 30s timeout...
   🔍 [DIAGNOSTIC] Query completed in XXXms
   ```

### 예상 결과

#### ✅ Case 1: 데이터가 정상 로드됨
**결론**: **Realtime WebSocket이 문제**

**증상**:
- 콘솔에 `✅ [DIAGNOSTIC] Fetched XXX whales` 표시
- 화면에 고래 데이터 표시
- Query 완료 시간 < 5초

**다음 단계**:
- Realtime 연결 설정 최적화
- Connection pooling 조정
- Realtime 구독 방식 변경 고려

#### ❌ Case 2: 여전히 타임아웃 발생
**결론**: **PostgREST REST API 또는 Network 문제**

**증상**:
- 콘솔에 `❌ [DIAGNOSTIC] Error: Query timeout after 30 seconds`
- 화면에 에러 메시지
- Loading 상태가 30초 지속

**다음 단계**: Test #2 실행 (REST API 직접 테스트)

---

## 🎯 Diagnostic Test #2: REST API Direct Test

### 목적
Supabase REST API가 Render 환경에서 정상 작동하는지 확인

### 테스트 방법 (Render Shell에서)

#### 1. Render Shell 접속
Render Dashboard → Web Service → "Shell" 탭 클릭

#### 2. 환경변수 확인
```bash
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:20}..."
```

#### 3. Node.js 테스트 스크립트 실행
```bash
node backend/scripts/testRenderConnection.js
```

#### 4. curl 직접 테스트 (대체 방법)
```bash
curl -w "\nTime: %{time_total}s\n" -v \
  "https://cweqpoiylchdkoistmgi.supabase.co/rest/v1/whale_events?select=id,timestamp&limit=10" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"
```

### 예상 결과

#### ✅ Case A: REST API 정상 (<5초)
**결론**: **Frontend 빌드/라우팅 문제**

**증상**:
- Node.js 스크립트: `✅ SUCCESS: Supabase REST API is working!`
- Query time: <5000ms
- 데이터 정상 수신

**다음 단계**:
- Vite 빌드 최적화
- 환경변수 embed 확인
- Frontend 라우팅 검토

#### ⏱️ Case B: REST API 느림 (5-30초)
**결론**: **Render → Supabase 네트워크 레이턴시**

**증상**:
- Query time: 5000-30000ms
- 데이터는 수신되지만 매우 느림

**다음 단계**:
- Supabase region 확인 (Render와 동일 region 권장)
- Connection pooling 설정
- Query 캐싱 고려

#### ❌ Case C: REST API 타임아웃 (>30초)
**결론**: **Supabase 프로젝트 문제** (가장 가능성 높음 70%)

**증상**:
- `❌ REQUEST TIMEOUT after 30000ms`
- 데이터 수신 실패

**원인 가능성**:
1. **Supabase 프로젝트 Paused** (70%)
2. **Supabase 무료 티어 한도 초과** (20%)
3. **Supabase API 장애** (10%)

**즉시 확인사항**:
1. https://supabase.com/dashboard
2. Project `cweqpoiylchdkoistmgi` 상태
3. 상단에 "Paused" 배너 → **Resume 클릭**

---

## 🎯 Diagnostic Test #3: Browser Console Test

### 목적
브라우저에서 직접 REST API 호출하여 프론트엔드 환경 테스트

### 테스트 방법

#### 1. Render 배포 URL 접속
`https://submarine-xxx.onrender.com`

#### 2. 브라우저 개발자 도구 콘솔 열기 (F12)

#### 3. 다음 코드 붙여넣기
```javascript
// Test 1: 환경변수 확인
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

// Test 2: 직접 REST API 호출
const testQuery = async () => {
  const start = Date.now()
  console.log('⏳ Starting query...')

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/whale_events?select=id,timestamp&limit=10`,
      {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      }
    )

    const duration = Date.now() - start
    console.log(`✅ Response received in ${duration}ms`)
    console.log('Status:', response.status)

    const data = await response.json()
    console.log('Data:', data)
    console.log('Records:', data.length)

    return data
  } catch (err) {
    const duration = Date.now() - start
    console.error(`❌ Error after ${duration}ms:`, err)
  }
}

// 실행
testQuery()
```

### 예상 결과

#### ✅ 성공 (<5초)
**결론**: React 렌더링 또는 상태 관리 문제

#### ❌ 타임아웃 (>30초)
**결론**: Supabase 프로젝트 문제 → Dashboard 확인 필요

---

## 📊 Decision Tree

```
Production Timeout (30s)
│
├─ Test #1: Realtime Disabled
│  ├─ ✅ 데이터 로드 성공
│  │  └─ 원인: Realtime WebSocket
│  │     └─ 해결: Realtime 최적화
│  │
│  └─ ❌ 여전히 타임아웃
│     └─ Test #2: REST API Direct Test (Render Shell)
│        ├─ ✅ 성공 (<5초)
│        │  └─ 원인: Frontend 빌드/라우팅
│        │     └─ 해결: Vite 최적화
│        │
│        ├─ ⏱️ 느림 (5-30초)
│        │  └─ 원인: Network 레이턴시
│        │     └─ 해결: Region 최적화, 캐싱
│        │
│        └─ ❌ 타임아웃 (>30초)
│           └─ 원인: Supabase 프로젝트
│              └─ 해결: Dashboard → Resume Project
```

---

## 🚀 즉시 실행 체크리스트

### Step 1: Frontend 재배포 (Realtime 비활성화 적용)
- [ ] `git add frontend/src/hooks/useWhaleData.js`
- [ ] `git commit -m "test: Diagnostic - Realtime disabled"`
- [ ] `git push origin main`
- [ ] Render 자동 배포 완료 대기 (5-10분)

### Step 2: Browser Console 테스트
- [ ] Render URL 접속
- [ ] F12 → Console 탭
- [ ] 로그 확인:
  - `🔍 [DIAGNOSTIC] Starting fetchWhales...`
  - `🔍 [DIAGNOSTIC] Query completed in XXXms`
  - `✅ [DIAGNOSTIC] Fetched XXX whales` 또는 `❌ Error`

### Step 3: 결과에 따라 다음 단계 진행
- ✅ 데이터 로드 성공 → Realtime 최적화 계획
- ❌ 타임아웃 지속 → Test #2 (Render Shell 테스트)

---

## 📝 예상 원인 (업데이트된 확률)

1. **Supabase 프로젝트 Paused**: 60% ⬆️
   - REST API까지 타임아웃된다면 가장 가능성 높음

2. **Realtime WebSocket 문제**: 25%
   - Render 환경에서만 발생 가능

3. **Network 레이턴시**: 10%
   - Render-Supabase 간 지역 차이

4. **Frontend 빌드 문제**: 5%
   - 환경변수 embed 실패 등

---

## 🎯 최종 목표

**타임아웃이 발생하는 정확한 레이어를 식별**:
- Database ❌ (이미 확인: 2.5ms)
- RLS Policies ❌ (이미 확인: 최적화 완료)
- PostgREST REST API ❓ (Test #2로 확인)
- Realtime WebSocket ❓ (Test #1로 확인)
- Frontend Build/Route ❓ (Test #3으로 확인)
- Network/Supabase Project ❓ (모든 테스트로 확인)

---

## 다음 보고 형식

테스트 완료 후 다음 정보 공유:

```
Test #1 결과:
- [ ] 데이터 로드 성공
- [ ] 타임아웃 지속
- 콘솔 로그: (스크린샷 또는 텍스트)

Test #2 결과 (타임아웃 지속 시):
- Query time: XXXms
- Status code: XXX
- 에러 메시지: (있다면)
```
