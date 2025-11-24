# Render 배포 문제 진단 체크리스트

## 현상
- 로컬: 정상 작동 ✅
- Render: 모든 DB 쿼리 타임아웃 ❌
- 에러: `Query timeout after 10 seconds`, `CHANNEL_ERROR`

## 환경변수 상태
✅ SUPABASE_URL 정상 로드
✅ ANON_KEY 정상 로드

---

## 진단 단계

### Step 1: Supabase 프로젝트 상태 확인 ⚠️ 가장 중요

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard

2. **프로젝트 상태 확인**
   - Project: `cweqpoiylchdkoistmgi`
   - 상태: Active / Paused?

   **Paused 상태라면**:
   - "Resume Project" 버튼 클릭
   - 5-10분 대기 (프로젝트 재시작)
   - Render에서 다시 테스트

3. **Realtime 활성화 확인**
   - Database → Replication 탭
   - 다음 테이블이 체크되어 있는지 확인:
     - [ ] whale_events
     - [ ] indicator_alerts
     - [ ] market_sentiment

   **체크 안 되어 있다면**:
   - 각 테이블 체크
   - "Save" 클릭

---

### Step 2: Database 연결 모드 확인

**현재 사용 중인 연결 방식**:
- Frontend → Supabase JS Client → HTTP REST API

**확인 사항**:
1. Supabase Dashboard → Settings → Database
2. **Connection Pooling 상태**
   - Transaction Pooler: 활성화되어 있는지?
   - Port: 6543 (권장) 또는 5432

3. **Connection String 확인**
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[HOST]:6543/postgres
   ```

---

### Step 3: RLS 정책 재확인

Supabase SQL Editor에서 실행:

```sql
-- anon 역할로 테스트
SET ROLE anon;

-- whale_events 조회 테스트
SELECT COUNT(*) FROM whale_events;
-- 결과가 나와야 함 (에러 나면 RLS 문제)

-- indicator_alerts 조회 테스트
SELECT COUNT(*) FROM indicator_alerts;

-- 역할 초기화
RESET ROLE;
```

**에러 나면**:
- `backend/sql/emergency_rls_fix.sql` 실행

---

### Step 4: Supabase 무료 티어 한도 확인

**Dashboard → Settings → Usage**:
- Database Size: __ / 500 MB
- Bandwidth: __ / 5 GB
- Edge Function Invocations: __
- **Active connections**: __ / ?? (중요!)

**Active connections이 한도 초과했다면**:
- 오래된 연결 종료 필요
- Connection pooling 설정 조정

---

### Step 5: 네트워크 테스트 (Render 서버에서)

Render Shell에서 실행:

```bash
# Supabase 연결 테스트
curl -v https://cweqpoiylchdkoistmgi.supabase.co/rest/v1/whale_events?limit=1 \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**200 OK 나와야 정상**
**403/401 → 인증 문제**
**Timeout → 네트워크 문제**

---

### Step 6: Supabase API 상태 확인

https://status.supabase.com/

**Incident 있는지 확인**

---

## 해결 방법 (우선순위)

### A. Supabase 프로젝트 Pause → Resume ⭐⭐⭐
가장 가능성 높음. Supabase Dashboard에서 Resume 클릭.

### B. Realtime 재활성화 ⭐⭐
Database → Replication에서 테이블 체크.

### C. Connection Pool 조정 ⭐
```javascript
// frontend/src/utils/supabase.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false, // 세션 저장 안 함 (연결 절약)
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Realtime 이벤트 제한
    },
  },
})
```

### D. Timeout 증가 (임시 방편) ⭐
```javascript
// useWhaleData.js
setTimeout(() => reject(new Error('Query timeout')), 30000) // 10초 → 30초
```

---

## 예상 원인 (확률)

1. **Supabase 프로젝트 Pause 상태**: 70%
2. **Realtime 비활성화**: 15%
3. **Connection Pool 고갈**: 10%
4. **네트워크 지연**: 5%

---

## 즉시 실행할 명령

### Supabase 프로젝트 상태 확인
```bash
# Supabase CLI 설치되어 있다면
supabase projects list
supabase status
```

### 또는 브라우저에서
1. https://supabase.com/dashboard
2. 프로젝트 `cweqpoiylchdkoistmgi` 클릭
3. 상단에 "Paused" 배너 있는지 확인
4. 있다면 "Resume" 클릭

---

다음 정보를 공유해주세요:
1. Supabase 프로젝트 상태 (Active/Paused)
2. Database → Replication에서 whale_events 테이블 체크 여부
3. Settings → Usage에서 Active connections 수
