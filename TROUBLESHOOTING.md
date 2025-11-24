# 🔧 배포 환경 데이터베이스 연결 문제 해결 가이드

**마지막 업데이트**: 2025-11-24
**대상**: 배포 환경에서 데이터베이스 연결이 끊기는 문제

---

## 🚨 증상

- 로컬 환경에서는 정상 작동
- 배포 환경(Vercel/Netlify/etc)에서는 데이터 로드 안 됨
- 브라우저 콘솔에 "Database connection failed" 에러

---

## 📋 진단 단계

### 1단계: 브라우저 콘솔 확인

배포된 사이트를 열고 **F12 → Console** 탭에서 다음 로그 확인:

```
🔍 Testing Supabase connection...
   ENV.DEV: false
   ENV.MODE: production
   ENV.VITE_DEV_MODE: false
   SUPABASE_URL: https://cweqpoiylchdkoistmgi.supabase.co
   ANON_KEY: eyJhbGciOiJIUzI1NiIs...
```

**확인 사항**:
- ✅ `SUPABASE_URL`이 올바른 URL인가?
- ✅ `ANON_KEY`가 표시되는가? (MISSING이면 환경변수 문제)
- ✅ 연결 테스트 결과가 PASSED인가?

### 2단계: 환경변수 확인

#### Vercel 배포 시
1. Vercel Dashboard → 프로젝트 선택 → Settings → Environment Variables
2. 다음 변수들이 설정되어 있는지 확인:

```bash
VITE_SUPABASE_URL=https://cweqpoiylchdkoistmgi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZXFwb2l5bGNoZGtvaXN0bWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTA5MTQsImV4cCI6MjA3ODc2NjkxNH0.7ZRf1O85Y_z87Gz61Z6TGrZHwvgnikTtuy8iMYhU1IM
VITE_DEV_MODE=false
```

3. **Environment** 설정 확인:
   - Production: ✅ 체크
   - Preview: ✅ 체크 (선택사항)
   - Development: ✅ 체크 (선택사항)

4. 저장 후 **Redeploy** 필수!

#### Netlify 배포 시
1. Netlify Dashboard → Site settings → Environment variables
2. 위와 동일한 환경변수 설정
3. **Deploy settings → Trigger deploy → Clear cache and deploy site**

### 3단계: Supabase RLS 정책 확인

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- 1. whale_events 테이블 RLS 정책 확인
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'whale_events';
```

**기대 결과**: 익명 읽기 허용 정책이 있어야 함

```sql
-- 정책이 없으면 생성
CREATE POLICY "Allow anonymous read access"
  ON whale_events
  FOR SELECT
  USING (true);
```

```sql
-- 2. indicator_alerts 테이블 확인
SELECT
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'indicator_alerts';
```

```sql
-- 정책이 없으면 생성
CREATE POLICY "Allow anonymous read access"
  ON indicator_alerts
  FOR SELECT
  USING (true);
```

### 4단계: 브라우저 캐시 삭제

배포 후에도 문제가 지속되면:

1. **F12 → Application 탭 (Chrome) / Storage 탭 (Firefox)**
2. **Clear storage** 또는 다음 항목 수동 삭제:
   - Local Storage
   - Session Storage
   - Cookies
3. **Hard Refresh**: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)

### 5단계: Network 탭 확인

1. **F12 → Network 탭**
2. 페이지 새로고침
3. `https://cweqpoiylchdkoistmgi.supabase.co` 요청 확인

**확인 사항**:
- Status Code: 200 OK여야 함
- Response: 데이터가 반환되는지 확인
- Error: CORS, 401, 403 에러가 있는지 확인

---

## 🛠️ 자주 발생하는 문제 및 해결책

### 문제 1: 환경변수가 빌드에 포함되지 않음

**증상**:
```
SUPABASE_URL: undefined
ANON_KEY: MISSING
```

**해결**:
1. Vercel/Netlify에 환경변수 추가
2. **Redeploy** 실행 (중요!)
3. 환경변수 이름이 정확한지 확인: `VITE_` 접두사 필수

### 문제 2: RLS 정책 문제

**증상**:
```
❌ Supabase connection test FAILED: new row violates row-level security policy
```

**해결**:
```sql
-- Supabase Dashboard → SQL Editor
CREATE POLICY "Allow anonymous read access"
  ON whale_events
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous read access"
  ON indicator_alerts
  FOR SELECT
  USING (true);
```

### 문제 3: CORS 에러

**증상**:
```
Access to fetch at 'https://cweqpoiylchdkoistmgi.supabase.co' has been blocked by CORS policy
```

**해결**:
1. Supabase Dashboard → Settings → API
2. **CORS Allowed Origins** 확인
3. 배포 URL 추가 (예: `https://your-app.vercel.app`)

### 문제 4: 캐시된 빌드

**증상**: 로컬에서는 작동하는데 배포 환경에서는 안 됨

**해결**:
```bash
# 로컬에서 프로덕션 빌드 테스트
cd frontend
rm -rf dist node_modules/.vite
npm run build
npm run preview
```

브라우저에서 `http://localhost:4173` 접속하여 프로덕션 빌드 테스트

---

## 🔍 고급 진단

### Connection Pool 상태 확인

Supabase Dashboard → SQL Editor:

```sql
SELECT
  count(*) as active_connections,
  max_conn - count(*) as available_connections
FROM pg_stat_activity
CROSS JOIN (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') s;
```

**경고**: `available_connections < 10`이면 Connection Pool 고갈 의심

### 느린 쿼리 확인

```sql
SELECT
  pid,
  now() - query_start as duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;
```

**조치**: 5초 이상 걸리는 쿼리가 있으면 최적화 필요

---

## 📝 체크리스트

배포 전 필수 확인 사항:

### 환경변수
- [ ] `VITE_SUPABASE_URL` 설정됨
- [ ] `VITE_SUPABASE_ANON_KEY` 설정됨
- [ ] `VITE_DEV_MODE=false` 설정됨
- [ ] 환경변수 저장 후 Redeploy 실행

### Supabase 설정
- [ ] `whale_events` RLS 정책 확인
- [ ] `indicator_alerts` RLS 정책 확인
- [ ] `market_sentiment` RLS 정책 확인
- [ ] 익명 읽기 허용됨

### 빌드 테스트
- [ ] `npm run build` 성공
- [ ] `npm run preview`로 로컬 프로덕션 빌드 테스트
- [ ] 브라우저 콘솔에 에러 없음
- [ ] 데이터 로드 확인

### 배포 후
- [ ] 배포 URL 접속
- [ ] F12 콘솔에서 연결 테스트 PASSED 확인
- [ ] 고래 데이터 표시 확인
- [ ] 알림 데이터 표시 확인

---

## 🚀 빠른 수정 (Quick Fix)

가장 흔한 원인 3가지를 한 번에 해결:

### 1. 환경변수 재설정
```bash
# Vercel/Netlify Dashboard에서
VITE_SUPABASE_URL=https://cweqpoiylchdkoistmgi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZXFwb2l5bGNoZGtvaXN0bWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTA5MTQsImV4cCI6MjA3ODc2NjkxNH0.7ZRf1O85Y_z87Gz61Z6TGrZHwvgnikTtuy8iMYhU1IM
VITE_DEV_MODE=false
```

### 2. RLS 정책 재생성
```sql
-- Supabase Dashboard → SQL Editor
DROP POLICY IF EXISTS "Allow anonymous read access" ON whale_events;
DROP POLICY IF EXISTS "Allow anonymous read access" ON indicator_alerts;

CREATE POLICY "Allow anonymous read access"
  ON whale_events
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous read access"
  ON indicator_alerts
  FOR SELECT
  USING (true);
```

### 3. 캐시 클리어 후 재배포
- Vercel: **Deployments → ... → Redeploy → Use existing Build Cache: OFF**
- Netlify: **Deploys → Trigger deploy → Clear cache and deploy site**

---

## 📞 추가 도움이 필요하면

1. **Supabase 로그 확인**:
   - Supabase Dashboard → Logs → PostgreSQL Logs
   - 최근 에러 메시지 확인

2. **Vercel/Netlify 로그 확인**:
   - 배포 로그에서 빌드 에러 확인
   - 런타임 로그에서 에러 확인

3. **GitHub Issues**:
   - https://github.com/parkgrace007/sub-marine/issues

---

**작성**: Claude Code
**최종 업데이트**: 2025-11-24
