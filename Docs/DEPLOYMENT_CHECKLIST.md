# Frontend Deployment Checklist

**Last Updated**: 2025-11-24
**Environment**: Production (Vercel/Render/Netlify)

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables ✅

#### Frontend (.env.production 또는 Hosting Provider Dashboard)

```bash
# Supabase
VITE_SUPABASE_URL=https://cweqpoiylchdkoistmgi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API (if using backend)
VITE_API_URL=https://your-backend.onrender.com

# Mode
VITE_DEV_MODE=false
```

**확인 사항**:
- [ ] `VITE_SUPABASE_URL` 정확한 URL인지 확인
- [ ] `VITE_SUPABASE_ANON_KEY` 올바른 키인지 확인 (Service Role 아님!)
- [ ] `VITE_DEV_MODE=false` 설정 (프로덕션)
- [ ] `VITE_API_URL` backend URL과 일치하는지 확인

#### Backend (.env또는 Hosting Provider Dashboard)

```bash
# Supabase
SUPABASE_URL=https://cweqpoiylchdkoistmgi.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Whale Alert API
WHALE_ALERT_API_KEY=your_whale_alert_key

# Server
PORT=3000
NODE_ENV=production
```

**확인 사항**:
- [ ] `SUPABASE_SERVICE_KEY` 사용 (백엔드만 사용)
- [ ] `WHALE_ALERT_API_KEY` 유효한지 확인
- [ ] `NODE_ENV=production` 설정

---

### 2. Supabase Configuration ✅

#### A. RLS (Row Level Security) Policies

```sql
-- ✅ whale_events 테이블 - 익명 읽기 허용
CREATE POLICY "Allow anonymous read access"
  ON whale_events
  FOR SELECT
  USING (true);

-- ✅ indicator_alerts 테이블 - 익명 읽기 허용
CREATE POLICY "Allow anonymous read access"
  ON indicator_alerts
  FOR SELECT
  USING (true);

-- ✅ market_sentiment 테이블 - 익명 읽기 허용
CREATE POLICY "Allow anonymous read access"
  ON market_sentiment
  FOR SELECT
  USING (true);
```

**⚠️ 절대 하면 안 되는 것**:
```sql
-- ❌ 다른 테이블 참조하는 RLS 정책
CREATE POLICY "Bad policy"
  ON table_name
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM other_table WHERE ...)  -- ← Connection Pool 고갈
  );
```

**확인 방법**:
```sql
-- Supabase Dashboard → SQL Editor
SELECT
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('whale_events', 'indicator_alerts', 'market_sentiment');
```

#### B. Connection Pool 설정

**Supabase 무료 플랜 제한**:
- Max connections: 50
- Pooler connections: 15

**권장 설정**:
- Frontend: Supabase JS Client (자동 pooling)
- Backend: `{ auth: { autoRefreshToken: false, persistSession: false } }`

#### C. Realtime 설정

**활성화 확인**:
1. Supabase Dashboard → Database → Replication
2. `whale_events` 테이블에 `REPLICA IDENTITY FULL` 설정:
   ```sql
   ALTER TABLE whale_events REPLICA IDENTITY FULL;
   ```
3. Realtime 구독 활성화:
   ```sql
   -- Supabase Dashboard → Database → Publications
   -- public 스키마의 whale_events, indicator_alerts 체크
   ```

---

### 3. Build & Test ✅

#### A. Local Build Test

```bash
# Frontend
cd frontend
npm run build

# 빌드 결과 확인
ls -lh dist/

# 로컬에서 프로덕션 빌드 테스트
npm run preview
```

**기대 결과**:
- `dist/` 폴더 생성됨
- `index.html`, `assets/` 폴더 존재
- Preview 서버에서 정상 작동

#### B. Backend Test

```bash
# Backend
cd backend
NODE_ENV=production node src/server.js

# 또는
npm start
```

**확인 사항**:
- [ ] 서버 시작 성공
- [ ] Supabase 연결 성공
- [ ] Whale Alert WebSocket 연결 성공
- [ ] 데이터 fetch 성공

#### C. 연결 테스트

**Frontend**:
```bash
# 브라우저 Console에서 테스트
const { data, error } = await supabase.from('whale_events').select('count', { count: 'exact', head: true })
console.log('Count:', data, 'Error:', error)
```

**기대 결과**: count 반환, error = null

---

### 4. Code Quality ✅

#### A. Console Logs 제거

**확인할 파일**:
- `frontend/src/hooks/useWhaleData.js`
- `frontend/src/components/WhaleCanvas.jsx`
- `frontend/src/pages/MainPage.jsx`

**허용되는 로그**:
- ✅ `console.error()` - 에러 로깅
- ✅ `console.warn()` - 경고 (최소한으로)
- ✅ `console.log()` - 중요한 이벤트만 (fetch 성공 등)

**제거해야 할 로그**:
- ❌ 디버깅용 로그 (flow distribution, filter settings 등)
- ❌ 과도한 상태 변화 로그

#### B. Error Handling

**확인 사항**:
- [ ] Supabase 쿼리 에러 catch
- [ ] Timeout 설정 (10초)
- [ ] 사용자 친화적 에러 메시지
- [ ] Fallback UI 존재

---

### 5. Performance ✅

#### A. Bundle Size

```bash
npm run build

# 빌드 크기 확인
du -sh dist/
```

**권장 크기**:
- Total: < 5MB
- Main JS: < 500KB (gzipped)
- Vendor JS: < 1MB (gzipped)

#### B. Lazy Loading

**확인 사항**:
- [ ] 라우트별 code splitting
- [ ] 이미지 lazy loading
- [ ] Heavy 컴포넌트 dynamic import

#### C. Caching

**확인 사항**:
- [ ] Static assets에 cache header 설정
- [ ] Supabase query caching (선택사항)

---

## 🚀 Deployment Steps

### Option A: Vercel (추천)

#### 1. GitHub Repository 연결

```bash
# Git repository 설정 (if not already)
git remote add origin https://github.com/yourusername/submarine.git
git push -u origin main
```

#### 2. Vercel 설정

1. [Vercel Dashboard](https://vercel.com) 접속
2. "New Project" 클릭
3. GitHub repository 선택
4. 설정:
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### 3. 환경변수 설정

Vercel Dashboard → Project → Settings → Environment Variables:

```
VITE_SUPABASE_URL = https://cweqpoiylchdkoistmgi.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL = https://your-backend.onrender.com
VITE_DEV_MODE = false
```

#### 4. 배포

```bash
# 자동 배포 (git push 시)
git add .
git commit -m "feat: Production deployment"
git push origin main

# 수동 배포
vercel --prod
```

---

### Option B: Netlify

#### 1. netlify.toml 생성

```toml
# frontend/netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
  base = "frontend"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 2. 환경변수 설정

Netlify Dashboard → Site Settings → Environment Variables

#### 3. 배포

```bash
# Netlify CLI
npm install -g netlify-cli
netlify deploy --prod
```

---

### Option C: Render (Backend + Frontend)

#### Frontend Static Site

1. Render Dashboard → New Static Site
2. 설정:
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

#### Backend Web Service

1. Render Dashboard → New Web Service
2. 설정:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment Variables: Supabase, Whale Alert keys

---

## 🔍 Post-Deployment Verification

### 1. Functionality Check ✅

**프론트엔드 확인**:
- [ ] 페이지 로드 성공
- [ ] 고래 데이터 표시됨
- [ ] 타임프레임 변경 작동
- [ ] Symbol 필터 작동
- [ ] Realtime 업데이트 작동

**방법**:
1. 프로덕션 URL 접속
2. F12 → Network 탭 확인
3. Console에 에러 없는지 확인
4. 고래가 화면에 표시되는지 확인

### 2. API Connectivity ✅

**Supabase 연결**:
```javascript
// Browser Console
const { data, error } = await supabase.from('whale_events').select('count')
console.log(data, error)
```

**Backend API** (if deployed):
```bash
curl https://your-backend.onrender.com/health
```

### 3. Performance Check ✅

**Lighthouse Score**:
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 80
- SEO: > 80

**측정 방법**:
1. Chrome DevTools → Lighthouse
2. "Generate report" 클릭

### 4. Error Monitoring ✅

**확인 사항**:
- [ ] Console에 에러 없음
- [ ] Network 요청 실패 없음
- [ ] Supabase connection pool 정상
- [ ] Backend logs 정상

---

## 🚨 Rollback Plan

### 문제 발생 시

#### 1. 즉시 이전 버전으로 롤백

**Vercel**:
```bash
vercel rollback
```

**Netlify**:
1. Netlify Dashboard → Deploys
2. 이전 배포 선택 → "Publish deploy"

**Render**:
1. Render Dashboard → Deploys
2. 이전 배포 선택 → "Restore"

#### 2. 문제 진단

```bash
# 브라우저 Console 로그 확인
# Network 탭에서 실패한 요청 확인
# Supabase Dashboard에서 Connection Pool 상태 확인
```

#### 3. Hotfix

```bash
# 문제 수정
git add .
git commit -m "hotfix: Fix production issue"
git push origin main

# 재배포
vercel --prod
```

---

## 📚 Troubleshooting

### Issue 1: 데이터 로드 안 됨

**증상**: 고래가 화면에 표시되지 않음

**진단**:
```javascript
// Browser Console
const { data, error } = await supabase.from('whale_events').select('*').limit(1)
console.log('Data:', data, 'Error:', error)
```

**해결**:
1. RLS 정책 확인 (익명 읽기 허용되어 있는지)
2. 환경변수 확인 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
3. [DATABASE_CONNECTION_ISSUE.md](DATABASE_CONNECTION_ISSUE.md) 참조

### Issue 2: Realtime 업데이트 안 됨

**증상**: 새로운 고래가 실시간으로 표시되지 않음

**진단**:
```javascript
// Browser Console에서 Realtime 구독 확인
// "Realtime subscription status: SUBSCRIBED" 로그 확인
```

**해결**:
1. Supabase Dashboard → Database → Replication 확인
2. `whale_events` 테이블 REPLICA IDENTITY FULL 설정
3. Publications에 테이블 추가

### Issue 3: Build 실패

**증상**: `npm run build` 실패

**해결**:
```bash
# 캐시 삭제
rm -rf node_modules dist .vite
npm install
npm run build
```

### Issue 4: CORS 에러

**증상**: `Access-Control-Allow-Origin` 에러

**해결**:
1. Backend에 CORS 설정 추가:
   ```javascript
   app.use(cors({
     origin: ['https://your-frontend.vercel.app', 'http://localhost:5173'],
     credentials: true
   }))
   ```

---

## 📝 Deployment History

| 날짜 | Version | 변경사항 | 배포자 |
|------|---------|----------|--------|
| 2025-11-24 | v1.0.0 | 초기 배포 | - |

---

## 🔗 Related Documents

- [DATABASE_CONNECTION_ISSUE.md](DATABASE_CONNECTION_ISSUE.md) - RLS 문제 해결 가이드
- [PRD.md](PRD.md) - 제품 요구사항
- [TASK.md](TASK.md) - 개발 진행 상황

---

**작성**: Claude Code
**최종 업데이트**: 2025-11-24 20:00 KST
