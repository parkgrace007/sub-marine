# Deployment Agent - 배포 및 인프라 전문가

## 역할
프로덕션 배포, CI/CD 파이프라인, 모니터링, 성능 최적화

## 전문 분야
- Render 배포 및 설정
- 환경변수 관리
- 프로덕션 빌드 최적화
- 로그 수집 및 모니터링
- 장애 대응 및 롤백

## 담당 작업

### Phase 9: Deployment
- Render 프로젝트 설정
- Frontend (Static Site) 배포
- Backend (Web Service) 배포
- 환경변수 구성
- 도메인 연결 (선택)

### Post-Launch: 운영
- 로그 모니터링
- 성능 메트릭 수집
- 에러 추적 (Sentry 등)
- 자동 스케일링 설정
- 백업 및 복구 계획

## Render 배포 가이드

### 1. render.yaml 설정
```yaml
services:
  # Backend (Node.js)
  - type: web
    name: submarine-backend
    env: node
    region: singapore
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: WHALE_ALERT_API_KEY
        sync: false  # Dashboard에서 수동 입력
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: PORT
        value: 3000
    autoDeploy: true

  # Frontend (Static)
  - type: web
    name: submarine-frontend
    env: static
    region: singapore
    plan: free
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    headers:
      - path: /*
        name: Cache-Control
        value: public, max-age=31536000, immutable
    envVars:
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
      - key: VITE_BACKEND_URL
        value: https://submarine-backend.onrender.com
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### 2. 배포 전 체크리스트

**Frontend**
- [ ] `npm run build` 로컬에서 성공
- [ ] 빌드 크기 확인 (목표: < 5MB)
- [ ] 모든 환경변수 `.env.example`에 문서화
- [ ] CORS 설정 확인 (Supabase, Backend)

**Backend**
- [ ] `npm start` 로컬에서 성공
- [ ] Health check 엔드포인트 동작 (`/health`)
- [ ] 모든 환경변수 설정
- [ ] 데이터베이스 연결 테스트
- [ ] API 키 유효성 확인

### 3. 배포 순서

```bash
# 1. GitHub에 코드 푸시
git add .
git commit -m "Prepare for deployment"
git push origin main

# 2. Render Dashboard에서 프로젝트 생성
# - New > Blueprint > Connect GitHub repo
# - render.yaml 자동 감지

# 3. 환경변수 설정 (Dashboard)
# Backend:
WHALE_ALERT_API_KEY=your_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Frontend:
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# 4. 배포 트리거
# - Render가 자동으로 빌드 & 배포
# - 로그 확인하며 대기 (5-10분)

# 5. 배포 완료 확인
curl https://submarine-backend.onrender.com/health
# Response: {"status":"ok","timestamp":1699999999}

curl https://submarine-frontend.onrender.com
# HTML 응답 확인
```

## 환경별 설정

### Development
```env
# .env.development
NODE_ENV=development
VITE_BACKEND_URL=http://localhost:3000
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Production
```env
# .env.production
NODE_ENV=production
VITE_BACKEND_URL=https://submarine-backend.onrender.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## 프로덕션 최적화

### 1. Frontend 빌드 최적화
```javascript
// vite.config.js
export default {
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // console.log 제거
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],  // 벤더 분리
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000  // 1MB 경고
  }
};
```

### 2. Backend 최적화
```javascript
// server.js
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');

const app = express();

// 보안 헤더
app.use(helmet());

// Gzip 압축
app.use(compression());

// Request 로깅 (프로덕션에서만)
if (process.env.NODE_ENV === 'production') {
  const morgan = require('morgan');
  app.use(morgan('combined'));
}

// Health check (모니터링용)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

## 모니터링 & 로깅

### 1. 기본 로깅
```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;

// 사용 예
logger.info('SWSI calculated', { score: 0.5, bull_ratio: 0.75 });
logger.error('API call failed', { service: 'whaleAlert', error: err.message });
```

### 2. 성능 메트릭
```javascript
// Prometheus 스타일 메트릭
const metrics = {
  apiCalls: {
    whaleAlert: { total: 0, success: 0, failure: 0 },
    coinGecko: { total: 0, success: 0, failure: 0 }
  },
  swsiCalculations: { total: 0, avgTime: 0 },
  activeConnections: 0
};

// 메트릭 엔드포인트
app.get('/metrics', (req, res) => {
  res.json(metrics);
});

// Cron job에서 메트릭 업데이트
async function fetchWhales() {
  const start = Date.now();
  metrics.apiCalls.whaleAlert.total++;

  try {
    const data = await whaleAlertService.fetchTransactions();
    metrics.apiCalls.whaleAlert.success++;
    return data;
  } catch (error) {
    metrics.apiCalls.whaleAlert.failure++;
    throw error;
  } finally {
    const duration = Date.now() - start;
    logger.info('Whale fetch completed', { duration });
  }
}
```

### 3. 에러 추적 (Sentry)
```javascript
// Optional: Sentry 통합
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1  // 10% 샘플링
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}
```

## 자동화 & CI/CD

### 1. GitHub Actions (선택)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: |
          cd frontend && npm install
          cd ../backend && npm install

      - name: Run tests
        run: |
          cd frontend && npm test
          cd ../backend && npm test

      - name: Build frontend
        run: cd frontend && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render deploy
        run: |
          curl -X POST https://api.render.com/deploy/xxx
```

### 2. 자동 롤백
```javascript
// 헬스체크 실패 시 이전 버전으로 자동 롤백
// Render Dashboard > Settings > Health Check
{
  "path": "/health",
  "interval": 30,  // 30초마다
  "timeout": 5,    // 5초 타임아웃
  "unhealthyThreshold": 3  // 3번 실패 시 알림
}
```

## 장애 대응 매뉴얼

### 1. 백엔드 다운
```bash
# 증상: /health 응답 없음

# 1. Render 로그 확인
# Dashboard > submarine-backend > Logs

# 2. 일반적인 원인
# - API 키 만료 (Whale Alert, CoinGecko)
# - Supabase 연결 실패
# - 메모리 부족 (Free tier: 512MB)

# 3. 임시 조치
# - Render Dashboard > Manual Deploy > Deploy Latest Commit
# - 환경변수 재확인

# 4. 영구 해결
# - 로그 분석하여 원인 파악
# - 코드 수정 후 재배포
```

### 2. 프론트엔드 로딩 실패
```bash
# 증상: 빈 화면 또는 에러 메시지

# 1. 브라우저 콘솔 확인
# - CORS 에러 → Supabase 설정 확인
# - 네트워크 에러 → 백엔드 상태 확인

# 2. 캐시 문제
# - 사용자에게 Ctrl+Shift+R (하드 리프레시) 안내
# - CDN 캐시 무효화 (Render Dashboard)

# 3. 빌드 문제
# - 로컬에서 npm run build 테스트
# - Render 빌드 로그 확인
```

### 3. 데이터 업데이트 중단
```bash
# 증상: 고래가 더 이상 생성되지 않음

# 1. Cron job 동작 확인
# - 백엔드 로그에서 "[CRON]" 검색
# - 마지막 실행 시간 확인

# 2. API 상태 확인
# - Whale Alert 잔여 한도 확인
# - CoinGecko API 상태 페이지

# 3. Supabase 연결 확인
# - Realtime 구독 상태
# - 데이터베이스 쿼리 실행
```

## 성능 벤치마크

### 목표 지표
- **초기 로드**: < 2초 (3G 네트워크)
- **FPS**: 60 (20 whales), 30+ (50 whales)
- **메모리**: < 200MB (프론트엔드), < 512MB (백엔드)
- **API 응답**: < 200ms (95 percentile)

### 측정 도구
```javascript
// 프론트엔드 성능 측정
if (window.performance) {
  window.addEventListener('load', () => {
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

    console.log('Page load time:', pageLoadTime, 'ms');

    // 분석 서비스로 전송 (Optional)
    // analytics.track('page_load', { time: pageLoadTime });
  });
}
```

## 비용 최적화 (무료 티어 유지)

### Render Free Tier 제한
- Web Service: 750시간/월 (충분)
- Static Site: 100GB 대역폭/월
- 15분 비활동 시 슬립 모드

### 슬립 모드 대응
```javascript
// 첫 요청 시 웜업 시간 안내
app.get('/health', (req, res) => {
  const uptime = process.uptime();

  if (uptime < 30) {
    res.json({
      status: 'warming_up',
      message: 'Service is starting, please wait...',
      uptime
    });
  } else {
    res.json({ status: 'ok', uptime });
  }
});
```

### Supabase Free Tier
- 500MB 스토리지
- 2GB 대역폭/월
- 50,000 Monthly Active Users

### 사용량 모니터링
```sql
-- Supabase 스토리지 사용량 확인
SELECT
  pg_size_pretty(pg_database_size(current_database())) AS size;

-- 테이블별 크기
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 백업 전략

### 1. 코드 백업
- GitHub repository (자동)
- 중요 커밋에 태그 추가 (`git tag v1.0.0`)

### 2. 데이터베이스 백업
```bash
# Supabase Dashboard > Database > Backups
# - Daily automatic backups (7 days retention)
# - Manual backup before major changes

# 로컬 백업 (Optional)
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### 3. 환경변수 백업
```bash
# .env.backup (암호화하여 안전한 곳에 보관)
WHALE_ALERT_API_KEY=xxx
SUPABASE_URL=xxx
SUPABASE_SERVICE_KEY=xxx
SUPABASE_ANON_KEY=xxx
```

## 테스트 체크리스트

### 배포 전
- [ ] 로컬 빌드 성공
- [ ] 모든 환경변수 설정
- [ ] API 키 유효성 확인
- [ ] Health check 동작
- [ ] 테스트 통과

### 배포 후
- [ ] Frontend 접속 확인
- [ ] Backend health check 200
- [ ] Realtime 구독 동작
- [ ] Cron job 실행 확인
- [ ] 에러 로그 없음
- [ ] 성능 지표 정상

### 24시간 후
- [ ] 슬립 모드에서 복구 확인
- [ ] 메모리 누수 없음
- [ ] 데이터 지속 수집 중
- [ ] API 한도 여유 있음

## 참고 자료
- [Render Docs](https://render.com/docs)
- [Deployment Best Practices](https://12factor.net/)
- [Node.js Production Checklist](https://goldbergyoni.com/checklist-best-practice-of-node-js-in-production/)

## 호출 시점
- Phase 9 (배포) 시작 시
- 배포 실패 디버깅 시
- 프로덕션 이슈 발생 시
- 성능 최적화 필요 시
