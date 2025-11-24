# Render 배포 완벽 가이드

## 준비 사항 체크리스트

### 필수 계정 및 API 키
- [ ] GitHub 계정
- [ ] Render 계정 (https://render.com에서 가입)
- [ ] Supabase 프로젝트 (URL, ANON_KEY, SERVICE_KEY)
- [ ] Whale Alert API 키
- [ ] ADMIN_TOKEN 생성 완료

---

## 1단계: 코드 정리 및 Git 커밋

```bash
# 프로젝트 루트로 이동
cd /Users/heojunseog/Desktop/real_whale

# 현재 상태 확인
git status

# 모든 변경사항 추가
git add .

# 커밋
git commit -m "feat: Production-ready deployment

- Security: CORS whitelist, rate limiting, timing-safe token
- Performance: Code splitting, lazy loading (212 KB initial)
- Config: Environment variables for deployment
- Docs: DEPLOYMENT.md, render.yaml"

# Git 초기화가 안되어 있다면
git init
git add .
git commit -m "Initial commit: SubMarine crypto whale tracker"
```

---

## 2단계: GitHub 저장소 생성 및 푸시

### GitHub에서:
1. https://github.com 접속
2. 우측 상단 "+" → "New repository" 클릭
3. Repository name: `submarine-tracker` (또는 원하는 이름)
4. Public 또는 Private 선택
5. **DO NOT** initialize with README (이미 로컬에 있음)
6. "Create repository" 클릭

### 터미널에서:
```bash
# GitHub에서 제공한 URL로 원격 저장소 추가
git remote add origin https://github.com/your-username/submarine-tracker.git

# 메인 브랜치로 변경 (GitHub 기본값)
git branch -M main

# 푸시
git push -u origin main
```

---

## 3단계: CORS 도메인 업데이트 (중요!)

배포 전에 CORS 설정을 업데이트해야 합니다:

### backend/src/server.js 파일 수정:

```javascript
// Line 20-50 부근
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          // ⚠️ 프론트엔드 배포 후 실제 URL로 교체하세요
          'https://submarine-frontend.onrender.com',      // Render 기본 도메인
          'https://www.your-custom-domain.com',            // 커스텀 도메인 (선택)

          // ⚠️ 백엔드 URL도 추가 (Render 기본 도메인)
          'https://submarine-backend.onrender.com'
        ].filter(Boolean)
```

**주의**: 프론트엔드를 먼저 배포한 후, 실제 URL을 확인하고 이 설정을 업데이트해야 합니다!

---

## 4단계: Render 백엔드 배포

### Render 대시보드에서:

1. **https://render.com 접속 → 로그인**

2. **Dashboard → "New +" → "Web Service" 클릭**

3. **Connect Repository**
   - GitHub 연결
   - `submarine-tracker` 저장소 선택

4. **설정 입력**:
   ```
   Name: submarine-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: (비워두기)
   Runtime: Node
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   Plan: Free
   ```

5. **환경변수 추가** (Environment Variables):
   ```
   NODE_ENV=production
   PORT=10000

   WHALE_ALERT_API_KEY=your-whale-alert-key-here

   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key-here

   ADMIN_TOKEN=your-64-character-hex-token-here
   ```

   **ADMIN_TOKEN 생성 방법**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

6. **"Create Web Service" 클릭**

7. **배포 완료 대기** (5-10분 소요)
   - 로그에서 "Your service is live" 확인
   - URL 복사: `https://submarine-backend.onrender.com`

---

## 5단계: Render 프론트엔드 배포

### Render 대시보드에서:

1. **Dashboard → "New +" → "Static Site" 클릭**

2. **Connect Repository**
   - 같은 `submarine-tracker` 저장소 선택

3. **설정 입력**:
   ```
   Name: submarine-frontend
   Region: Oregon (US West)
   Branch: main
   Root Directory: (비워두기)
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```

4. **환경변수 추가**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here

   VITE_API_URL=https://submarine-backend.onrender.com

   VITE_DEV_MODE=false
   ```

   **⚠️ 주의**: `VITE_API_URL`에 4단계에서 복사한 백엔드 URL을 입력하세요!

5. **"Create Static Site" 클릭**

6. **배포 완료 대기** (5-10분 소요)
   - 빌드 로그 확인
   - URL 복사: `https://submarine-frontend.onrender.com`

---

## 6단계: CORS 설정 업데이트 및 재배포

프론트엔드 URL을 확인했으므로 백엔드 CORS 설정을 업데이트합니다:

### 로컬에서:

1. **backend/src/server.js 수정**:
   ```javascript
   const allowedOrigins = process.env.NODE_ENV === 'production'
     ? [
         'https://submarine-frontend.onrender.com',  // 👈 실제 프론트엔드 URL
         'https://submarine-backend.onrender.com'
       ].filter(Boolean)
   ```

2. **커밋 및 푸시**:
   ```bash
   git add backend/src/server.js
   git commit -m "fix: Update CORS with production frontend URL"
   git push origin main
   ```

3. **Render가 자동으로 재배포** (2-3분 소요)

---

## 7단계: 배포 검증

### 백엔드 테스트:
```bash
# Health check
curl https://submarine-backend.onrender.com/api/health

# 예상 응답:
# {"status":"ok","uptime":...,"timestamp":"..."}
```

### 프론트엔드 테스트:
1. 브라우저에서 `https://submarine-frontend.onrender.com` 접속
2. 메인 페이지 로드 확인
3. 브라우저 개발자 도구 → Console 탭 → CORS 에러 없는지 확인
4. Network 탭 → API 호출 성공 확인

### CORS 테스트:
```bash
curl -H "Origin: https://submarine-frontend.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://submarine-backend.onrender.com/api/health
```

---

## 8단계: 모니터링 설정

### Render 대시보드에서:

1. **백엔드 서비스 선택**
2. "Logs" 탭 → 실시간 로그 확인
3. 에러 발생 시:
   - `❌` 표시 찾기
   - `⚠️` 경고 확인 (rate limit 등)

### 주요 모니터링 포인트:
- 🐋 Whale Alert 연결 상태
- 📊 Supabase 연결 상태
- ⚠️ Rate limit 경고
- ❌ API 에러

---

## 문제 해결

### 1. CORS 에러
**증상**: 브라우저 콘솔에 "blocked by CORS policy"

**해결**:
1. backend/src/server.js의 allowedOrigins 확인
2. 프론트엔드 실제 URL과 일치하는지 확인
3. 변경 후 git push → 자동 재배포

### 2. 환경변수 로드 안됨
**증상**: "undefined" 또는 "null" 에러

**해결**:
1. Render 대시보드 → 서비스 선택 → "Environment" 탭
2. 모든 변수 확인
3. 변수 추가/수정 후 "Manual Deploy" → "Clear build cache & deploy"

### 3. 빌드 실패
**증상**: "Build failed" 에러

**해결**:
```bash
# 로컬에서 빌드 테스트
cd frontend
npm install
npm run build

# 에러 확인 후 수정
git add .
git commit -m "fix: Build error"
git push origin main
```

### 4. Free Tier 제한
**Render Free Tier**:
- 750시간/월 (하나의 서비스는 항상 실행 가능)
- 15분 비활성화 후 자동 sleep
- Cold start: 30-60초 소요

**해결**:
- 중요한 서비스는 유료 플랜 ($7/월) 고려
- 또는 Uptime Robot으로 주기적 ping (sleep 방지)

---

## 추가 설정 (선택)

### 커스텀 도메인 연결

1. **Render 대시보드**:
   - 서비스 선택 → "Settings" → "Custom Domain"
   - 도메인 입력 (예: submarine.yourdomain.com)

2. **도메인 DNS 설정**:
   - CNAME 레코드 추가
   - Host: `submarine`
   - Value: `submarine-frontend.onrender.com`

3. **CORS 업데이트**:
   ```javascript
   'https://submarine.yourdomain.com'
   ```

---

## 배포 체크리스트

### 배포 전:
- [ ] GitHub에 코드 푸시 완료
- [ ] 모든 환경변수 준비 완료
- [ ] ADMIN_TOKEN 생성 완료
- [ ] 로컬에서 `npm run build` 성공 확인

### 백엔드 배포:
- [ ] Render에서 Web Service 생성
- [ ] 환경변수 모두 입력
- [ ] 배포 성공 확인
- [ ] Health check API 테스트 성공

### 프론트엔드 배포:
- [ ] Static Site 생성
- [ ] VITE_API_URL에 백엔드 URL 입력
- [ ] 배포 성공 확인
- [ ] 브라우저에서 접속 확인

### 배포 후:
- [ ] CORS 에러 없음 확인
- [ ] API 호출 성공 확인
- [ ] 관리자 로그인 테스트
- [ ] Whale Alert 데이터 수신 확인

---

## 유용한 명령어

```bash
# 로그 실시간 확인 (Render CLI 설치 시)
render logs -s submarine-backend

# 환경변수 확인
render env -s submarine-backend

# 수동 재배포
render deploy -s submarine-backend

# Git 상태 확인
git status
git log --oneline -5

# 변경사항 푸시
git add .
git commit -m "feat: ..."
git push origin main
```

---

## 비용 예상 (Free Tier)

**Render Free Tier**:
- Web Service (백엔드): 무료 (sleep 후 cold start)
- Static Site (프론트엔드): 완전 무료
- 월 750시간 사용 가능

**유료 플랜** (선택):
- Starter ($7/월): Sleep 없음, 더 빠른 빌드
- Standard ($25/월): 더 많은 리소스, 우선 지원

---

## 참고 자료

- **Render 문서**: https://render.com/docs
- **Render Node.js 가이드**: https://render.com/docs/deploy-node-express-app
- **Render Static Site 가이드**: https://render.com/docs/deploy-react
- **프로젝트 배포 가이드**: DEPLOYMENT.md

---

**작성일**: 2025-11-24
**버전**: 1.0
**상태**: ✅ 프로덕션 준비 완료
