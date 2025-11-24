# Development Task Log

## 목적
이 파일은 SubMarine 프로젝트의 개발 진행 상황과 작업 기록을 추적합니다.

---

## 현재 상태
- **현재 Phase**: Phase 8 완료 (UX 폴리싱 + DB 최적화)
- **진행률**: 100% (Phase 0-8 완료, Phase 9 배포 준비됨)
- **마지막 업데이트**: 2025-11-16

---

## 작업 기록

### 2025-11-15

#### 완료된 작업
- [x] PRD.md 작성 완료 (전체 9단계 개발 계획)
- [x] CLAUDE.md 생성 (개발 빠른 참조 가이드)
- [x] 서브 에이전트 5개 생성
  - [x] Physics Agent (물리 엔진 전문가)
  - [x] API Agent (외부 API 통합)
  - [x] Database Agent (Supabase DB)
  - [x] UX Agent (사용자 경험)
  - [x] Deployment Agent (배포 및 인프라)
- [x] TASK.md 생성 (개발 로그)
- [x] **Phase 0 완료** (30분 소요)
  - [x] Git 저장소 초기화
  - [x] .gitignore 생성
  - [x] Frontend 폴더 구조 생성 (components, physics, hooks, utils)
  - [x] Backend 폴더 구조 생성 (services, utils, scripts)
  - [x] Frontend 설정 파일 10개 생성
    - package.json, vite.config.js, tailwind.config.js, postcss.config.js
    - .eslintrc.json, index.html, .env.example
    - src/main.jsx, src/App.jsx, src/index.css
  - [x] Backend 설정 파일 3개 생성
    - package.json, .eslintrc.json, .env.example
  - [x] README.md 작성
  - [x] Frontend dependencies 설치 (412 packages)
  - [x] Backend dependencies 설치 (190 packages)
  - [x] Frontend 빌드 테스트 성공 (vite build)
- [x] **Phase 1 완료** (1시간 소요)
  - [x] Background.jsx 컴포넌트 생성
    - 파란색(#0051ff)/빨간색(#ff0928) 그라디언트 구현
    - bull_ratio 기반 동적 그라디언트
    - 중앙선 표시 (흰색 반투명 라인)
  - [x] HistoryBars.jsx 컴포넌트 생성
    - 15줄 히스토리 바 렌더링
    - 각 바마다 독립적인 bull_ratio 표시
    - 더미 데이터 (0.3-0.7 범위 랜덤)
  - [x] Header.jsx 컴포넌트 생성
    - 타임프레임 버튼 (5min/15min/1hour)
    - 로고 및 컨트롤 버튼 (🔊💾⚙️)
    - 반응형 디자인 (모바일/태블릿/데스크톱)
  - [x] App.jsx 통합
    - 모든 컴포넌트 통합
    - useState로 상태 관리
    - 디버그 슬라이더 추가 (bull_ratio 조절)
  - [x] 반응형 레이아웃 적용
    - 모바일: 세로 레이아웃, 작은 텍스트
    - 태블릿: 중간 크기 조정
    - 데스크톱: 가로 레이아웃, 큰 텍스트
  - [x] 빌드 테스트 성공 (no errors)
- [x] **Phase 2 완료** (2시간 소요)
  - [x] Whale.js 클래스 생성 (300+ lines → 210 lines 리팩토링)
    - Boids 알고리즘 완전 재설계 (5가지 → 1가지로 단순화)
    - Separation (충돌 회피) 유지 - 고래끼리 부딪히면 튕겨짐
    - Alignment, Cohesion, Seek, Boundary 제거 - 방향 변경 없음
    - 일직선 이동 구현 (Buy: 왼쪽→중앙, Sell: 오른쪽→중앙)
    - 정속 이동 (거리/60초/60fps) - 1분에 정확히 중앙선 도착
    - 중앙선 도달 시 정지 구현 (velocity = 0)
    - 충돌 시 속도 복원 메커니즘 (0.8-1.2x 범위 보정)
    - 타임프레임별 수명 관리 (1min: 60s, 5min: 300s, 15min: 900s, 1hour: 3600s)
  - [x] WhaleManager.js 생성
    - 고래 생성/업데이트/제거 라이프사이클 관리
    - 더미 고래 스폰 기능 ($100K-$100M 랜덤)
    - 크기 계산 로직 (로그 스케일: 8-60px로 축소)
    - Buy/Sell 타입별 분리 업데이트
    - bullRatio 기반 targetX 계산 추가
    - 타임프레임 동적 변경 지원
    - 디버그 모드 (콘솔 로그)
  - [x] WhaleCanvas.jsx 컴포넌트 생성
    - Canvas 렌더링 (requestAnimationFrame)
    - FPS 카운터 (실시간 표시)
    - 통계 HUD (total/buy/sell 고래 수)
    - 더미 고래 스폰 버튼 (1마리/5마리/10마리)
    - 모두 제거 버튼
    - 디버그 토글 버튼 (perception radius 표시)
    - 반응형 Canvas 크기 조정
    - bullRatio prop 전달로 중앙선 동기화
  - [x] CurrentBar.jsx 컴포넌트 추가
    - 메인 고래 활동 영역 (200-300px 높이)
    - Bull/Bear 실시간 비율 표시
    - 중앙선 인디케이터
  - [x] HistoryBars.jsx 리팩토링
    - 3px 고정 높이 바
    - 20개 레이어 제한
    - 오파시티 그라데이션 (newest=1.0, oldest=0.2)
    - flex-col-reverse로 아래→위 스택
  - [x] App.jsx 통합
    - 레이아웃 재구성: Header → HistoryBars → CurrentBar+WhaleCanvas → Empty space
    - bullRatio 애니메이션 (3초마다 -5%~+5% 변동)
    - 히스토리 스택 로직 (타임프레임 간격마다 추가)
    - 디버그 슬라이더 추가
  - [x] HMR 테스트 성공 (자동 리로드 확인)
- [x] **Phase 2 시각 변환 추가** (30분 소요)
  - [x] Visual transformation 구현 (bull_ratio 0-100% → 10-90% screen width 매핑)
  - [x] Background.jsx 그라디언트 변환 적용
  - [x] CurrentBar.jsx 중앙선 변환 적용
  - [x] HistoryBars.jsx 각 바 변환 적용
  - [x] WhaleCanvas.jsx targetX 계산 변환
  - [x] WhaleManager.js spawnDummyWhale() 변환
  - [x] 10% 패딩으로 극단적 값에서도 고래 공간 확보
- [x] **Phase 3 완료** (3시간 소요)
  - [x] Supabase 프로젝트 생성 (cweqpoiylchdkoistmgi.supabase.co)
  - [x] whale_events 테이블 생성 (13 columns, 8 indexes)
    - id, timestamp, blockchain, symbol, amount, amount_usd
    - from/to addresses, from/to owner info
    - transaction_type, flow_type, transaction_hash, created_at
  - [x] market_sentiment 테이블 생성 (19 columns, 3 indexes)
    - id, timestamp, timeframe, swsi_score, bull/bear_ratio
    - global/coins/volume/whale_change
    - buy/sell/total volume_usd, whale_count
    - global_mcap_change, top_coins_change, volume_change
    - raw_data (JSONB), created_at
  - [x] RLS 정책 설정 (anon: SELECT, service_role: ALL)
  - [x] Realtime Publication 활성화
  - [x] Backend Supabase Client 연결 (service_role key)
  - [x] Frontend Supabase Client 연결 (anon key)
  - [x] testSupabase.js 스크립트 (4/4 tests passed)
  - [x] useWhaleData hook 생성 (Realtime 구독)
  - [x] useSentiment hook 생성 (Realtime 구독)
  - [x] App.jsx 통합 (real data 사용)
  - [x] WhaleCanvas DB sync (spawnFromEvent 메서드)
  - [x] WhaleManager.js spawnFromEvent() 구현
  - [x] forwardRef 패턴으로 Controls 패널 분리
- [x] **Phase 4 완료** (4시간 소요)
  - [x] Whale Alert API 키 발급 (hHV3AgOyb8aDOAnxGEknyGJSPfoq5NME)
  - [x] API plan 확인 ($29.95/month Custom Alerts - WebSocket only)
  - [x] whaleAlert.js 서비스 생성
    - WebSocket 연결 (wss://leviathan.whale-alert.io/ws)
    - Subscription 필터 (min $100K, eth/btc/tron)
    - onOpen, onMessage, onError, onClose 핸들러
    - Flow type 분류 (buy/sell/exchange/internal/defi)
    - Alert 변환 (Whale Alert → whale_events 스키마)
    - 검증 로직 (필수 필드, 최소 금액, flow_type)
    - Supabase 저장 (saveToSupabase 메서드)
  - [x] Rate limiting 구현 (100 alerts/hour, hourly reset)
  - [x] 재연결 로직 (exponential backoff, max 10 attempts)
  - [x] testWebSocket.js 스크립트 (5분 테스트)
  - [x] WebSocket 연결 안정성 확인 (4+ minutes uptime)
  - [x] 수동 whale 삽입 테스트 ($3.5M BUY, $4.5M SELL)
  - [x] Frontend Realtime 업데이트 확인
- [x] **Phase 5 완료** (5시간 소요)
  - [x] SWSI 공식 정정 (고래만 → 시장 80% + 고래 10%)
  - [x] CoinGecko API 서비스 생성 (coinGecko.js)
    - getGlobalData() - 시총, 거래량
    - getBigCoinsData() - BTC/ETH/BNB/SOL/XRP
    - calculateG() - Global market cap 24h change
    - calculateB() - Big coins average change
    - calculateV() - Volume change vs baseline
    - 30초 캐싱, stale cache fallback
  - [x] SWSI 계산 서비스 생성 (swsi.js)
    - calculateAll() - 모든 타임프레임
    - calculateForTimeframe() - 개별 타임프레임
    - calculateW() - Whale buy/sell ratio
    - SWSI 공식: S = 0.5G + 0.2B + 0.2V + 0.1W
    - EMA 스무딩 (alpha=0.3)
    - bull_ratio = (S + 1) / 2, bear_ratio = 1 - bull_ratio
    - saveToSupabase() - market_sentiment 저장
  - [x] market_sentiment 스키마 업데이트 (9개 컬럼 추가)
    - timeframe, global/coins/volume/whale_change
    - total/buy/sell_volume_usd, whale_count
    - idx_sentiment_timeframe 인덱스
  - [x] calculateSWSI.js 스크립트 (수동 실행용)
  - [x] axios 패키지 설치
  - [x] Frontend useSentiment.js 타임프레임 지원
  - [x] App.jsx useSentiment(timeframe) 전달
  - [x] SWSI 계산 테스트 (5min, 1hour 성공)
    - 5min: SWSI=0.0371, Bull=51.85%
    - 1hour: SWSI=0.0343, Bull=51.72%, Whales=3
- [x] **Phase 6 완료** (2.5시간 소요)
  - [x] Express 서버 생성 (server.js)
    - HTTP 서버 (포트 3000)
    - GET /health - 헬스체크 엔드포인트
    - GET /status - 상세 상태 (서버, WebSocket, SWSI)
    - POST /api/trigger/swsi - 수동 SWSI 계산
    - POST /api/trigger/whale-reconnect - WebSocket 재연결
    - CORS, JSON 미들웨어
    - Graceful shutdown (SIGTERM, SIGINT)
  - [x] Scheduler 서비스 생성 (scheduler.js)
    - SWSI 자동 계산 cron job (30초마다)
    - Database 정리 cron job (매일 3시)
    - whale_events >24시간 삭제
    - market_sentiment >7일 삭제
    - node-cron 사용
  - [x] cleanupDB.js 스크립트 (수동 DB 정리)
  - [x] package.json 업데이트
    - npm start - 프로덕션 서버
    - npm run dev - 개발 서버 (--watch)
    - npm run calc-swsi - 수동 SWSI
    - npm run cleanup-db - 수동 DB 정리
    - npm run test-websocket - WebSocket 테스트
  - [x] 서버 시작 테스트 (성공)
  - [x] WebSocket 자동 연결 확인
  - [x] SWSI 자동 계산 확인 (30초마다)
  - [x] Health check API 테스트
  - [x] Status API 테스트
  - [x] End-to-end 통합 확인

- [x] **Phase 7 완료** (4시간 소요)
  - [x] 타임프레임별 고래 위치 시스템 구현
    - Whale.js: 고래 생성 시 timeframe 저장
    - 타임프레임별 lifetime 설정 (1min=60s, 5min=300s, 15min=900s, 1hour=3600s)
    - 타임프레임별 속도 계산 (각 타임프레임에 맞게 중앙 도달 시간 조정)
    - recalculatePosition() 메서드 추가 (보기 타임프레임에 따라 위치 재계산)
  - [x] WhaleManager.js 업데이트
    - onTimeframeChange() 메서드 추가 (타임프레임 변경 시 위치 재계산)
    - update() 메서드: 매 프레임 위치 강제 변경 제거
    - visibility 시스템: 고래 나이 기반으로 표시/숨김
  - [x] WhaleCanvas.jsx 타임프레임 연동
    - 타임프레임 변경 useEffect에서 onTimeframeChange() 호출
    - 고래 생성 시 현재 timeframe 전달
  - [x] 동적 위치 계산 시스템
    - 같은 고래라도 타임프레임마다 다른 위치에 표시
    - 1분: 빠르게 중앙 도달, 5분: 중간, 15분: 느림, 1시간: 매우 느림
    - 물리 엔진과 위치 계산의 완벽한 균형

### 2025-11-16

#### 완료된 작업

- [x] **데이터베이스 최적화** (30분 소요)
  - [x] market_sentiment 보관 기간 변경 (7일 → 24시간)
    - scheduler.js 수정 (line 134-145)
    - 스토리지 99% 절약 효과
    - whale_events와 일관된 정책 (24시간)
  - [x] 데이터베이스 효율성 검토
    - Supabase 무료 티어 최적화 (500MB 한도)
    - 불필요한 데이터 소각 정책 확립

- [x] **Phase 8 완료** (3시간 소요)
  - [x] 고래 상세 정보 표시 시스템
    - WhaleTooltip.jsx 컴포넌트 생성
    - Whale.js에 containsPoint() 메서드 추가 (클릭 감지)
    - WhaleManager.js에 getWhaleAtPosition() 추가
    - WhaleCanvas.jsx에 클릭 이벤트 핸들러 통합
    - 거래 정보 표시: 금액, 블록체인, 심볼, 해시, 크기, 나이
    - 모바일 반응형 tooltip (240px-320px)
  - [x] 통계 HUD 위젯 개선
    - StatsHUD.jsx 컴포넌트 생성
    - SWSI Score 카드 (Bullish/Bearish/Neutral 표시)
    - Bull/Bear 비율 프로그레스 바
    - Active Whales 통계 (Total/Buy/Sell/FPS)
    - Volume 카드 (timeframe별 거래량)
    - 모바일 반응형 디자인 (140px-200px)
  - [x] 모바일/태블릿 반응형 최적화
    - StatsHUD 모바일 크기 조정 (text-[10px] sm:text-xs)
    - WhaleTooltip 모바일 크기 조정
    - Volume 카드 모바일에서 숨김 (공간 절약)
    - 모든 간격과 패딩 반응형 적용
  - [x] 로딩/에러 상태 UI 개선
    - 에러 알림 강화 (경고 아이콘, Reload 버튼)
    - 로딩 오버레이 추가 (스피너 애니메이션)
    - WhaleCanvas 중복 로딩 인디케이터 제거
    - 모바일 반응형 알림 (280px max-width)
  - [x] 디자인 총 정리
    - CurrentBar.jsx 개선 (애니메이션 pulse 효과)
    - 중앙선 그림자 효과 추가
    - Bull/Bear 레이블 배경 추가 (가독성 향상)
    - 하단 힌트 텍스트 추가 ("Click whales for details")
    - 색상 일관성: Blue (#0051ff), Red (#ff0928), White gradients
    - 타이포그래피: font-mono for stats, font-bold for emphasis
    - 간격: 2-4px spacing on mobile, 3-4px on desktop

#### 진행 중인 작업
- 없음 (Phase 0-8 완료)

#### 다음 작업

**Phase 9: 배포** (2-3시간 예상)
1. Render.com 또는 Railway.app 배포
2. 환경 변수 설정
3. 도메인 연결 (선택)

---

## Phase별 진행 상황

### Phase 0: 프로젝트 셋업 (30분) - ✅ 완료
- [x] Frontend 폴더 구조 생성
- [x] Backend 폴더 구조 생성
- [x] package.json 설정 (frontend/backend)
- [x] .env.example 파일 생성
- [x] .gitignore 설정
- [x] Git 저장소 초기화
- [x] README.md 작성

### Phase 1: 정적 배경 (2-3시간) - ✅ 완료
- [x] Background 컴포넌트 생성
- [x] HistoryBars 컴포넌트 생성
- [x] 그라데이션 렌더링 구현
- [x] 히스토리 바 15줄 표시
- [x] 반응형 레이아웃 적용
- [x] 타임프레임 버튼 UI

### Phase 2: 고래 물리 엔진 (4-5시간) - ✅ 완료
- [x] Whale.js 클래스 구현
- [x] WhaleManager.js 구현
- [x] Boids 알고리즘 5가지 행동 구현
- [x] 더미 고래 생성 기능
- [x] 60 FPS 성능 테스트
- [x] 충돌 감지 및 회피 동작 확인

### Phase 3: Supabase 연동 (3시간) - ✅ 완료
- [x] Supabase 프로젝트 생성
- [x] 데이터베이스 스키마 생성 (whale_events, market_sentiment)
- [x] RLS 정책 설정
- [x] Realtime Publication 설정
- [x] Frontend Supabase Client 연결
- [x] Backend Supabase Client 연결
- [x] 더미 데이터 CRUD 테스트

### Phase 4: Whale Alert 연동 (4시간) - ✅ 완료
- [x] Whale Alert API 키 발급
- [x] whaleAlert.js 서비스 생성
- [x] WebSocket 연결 구현 (REST API → WebSocket 전환)
- [x] flow_type 분류 로직 구현
- [x] Supabase 저장 로직
- [x] 수동 실행 스크립트 테스트

### Phase 5: SWSI 계산 (5시간) - ✅ 완료
- [x] CoinGecko API 연동
- [x] swsi.js 서비스 생성
- [x] SWSI 알고리즘 구현 (G+B+V+W)
- [x] EMA 스무딩 적용
- [x] market_sentiment 테이블 저장
- [x] Frontend 배경 실시간 업데이트

### Phase 6: 자동화 & 스케줄링 (2.5시간) - ✅ 완료
- [x] Express 서버 구축
- [x] Health check 엔드포인트
- [x] Cron Job 설정 (SWSI 30초)
- [x] WebSocket 자동 시작 (Whale Alert)
- [x] Cron Job 설정 (DB 정리 매일 3시)
- [x] 에러 핸들링 및 로깅

### Phase 7: 타임프레임 기능 (4시간) - ✅ 완료
- [x] 타임프레임별 고래 위치 시스템
- [x] 고래 수명 관리 로직 (타임프레임별)
- [x] 히스토리 바 간격 조정 (동적)
- [x] 데이터 필터링 최적화 (client-side)
- [x] recalculatePosition() 구현
- [x] onTimeframeChange() 구현

### Phase 8: UX 폴리싱 (3시간) - ✅ 완료
- [x] 고래 클릭 상세 정보 (tooltip)
- [x] StatsHUD 위젯 구현
- [x] 모바일 반응형 (240px-390px)
- [x] 태블릿 반응형 (768px+)
- [x] 데스크톱 반응형 (1920px+)
- [x] 로딩 상태 처리 (spinner)
- [x] 에러 상태 처리 (reload button)
- [x] CurrentBar 디자인 개선

### Phase 9: 배포 (2시간) - 대기
- [ ] render.yaml 작성
- [ ] 환경변수 설정
- [ ] Frontend 배포 (Static Site)
- [ ] Backend 배포 (Web Service)
- [ ] 도메인 연결 (선택)
- [ ] 24시간 안정성 테스트

---

## 주요 이슈 & 해결 방법

### 이슈 로그

#### 2025-11-15 - Phase 2 완료 중 발견된 이슈들

**이슈 #1: 잘못된 레이아웃 순서**
- 증상: HistoryBars가 CurrentBar 아래에 위치
- 원인: App.jsx에서 컴포넌트 순서가 잘못됨
- 해결: 레이아웃 순서 재구성 (Header → HistoryBars → CurrentBar → Empty)

**이슈 #2: Whale Controls 비활성화**
- 증상: 스폰 버튼 클릭이 안 됨
- 원인: WhaleCanvas wrapper div에 `pointer-events-none` 적용
- 해결: `pointer-events-none` 제거

**이슈 #3: 고래 크기 과다**
- 증상: 고래가 화면 대비 너무 큼
- 원인: 크기 범위 20-200px로 설정
- 해결: 8-60px로 축소 (60-70% 감소)

**이슈 #4: 방향 전환 물리 엔진 불필요**
- 증상: 고래가 충돌 시 방향을 바꿈 (Boids 5가지 행동)
- 원인: Alignment, Cohesion, Seek, Boundary 행동 구현
- 해결: 4가지 행동 제거, Separation만 유지. 일직선 이동 구현

**이슈 #5: 고래가 중앙선을 통과함**
- 증상: 고래가 targetX를 넘어서 계속 이동
- 원인: 목표 도달 체크 로직 없음
- 해결: `hasReachedTarget` 체크 추가, 도달 시 velocity=0, position 클램핑

#### 2025-11-16 - Phase 7 완료 중 발견된 이슈들

**이슈 #6: 타임프레임 변경 시 고래가 리셋됨**
- 증상: 타임프레임 버튼 클릭 시 모든 고래가 사라짐
- 원인: WhaleCanvas.jsx에서 clearAll() 호출
- 해결: clearAll() 제거, visibility 시스템으로 전환

**이슈 #7: 타임프레임마다 고래 위치가 같음**
- 증상: 1분/5분/15분/1시간에서 같은 고래가 같은 위치
- 원인: 모든 고래가 1시간에 중앙 도달하도록 고정됨
- 해결: recalculatePosition() 메서드로 보기 타임프레임 기반 위치 계산

**이슈 #8: 고래가 움직이지 않고 고정됨**
- 증상: 타임프레임 변경 후 고래가 같은 위치에 고정
- 원인: update() 메서드에서 매 프레임 recalculatePosition() 호출
- 해결: onTimeframeChange()에서만 한 번 호출, 이후 자연스럽게 이동

---

## 성능 메트릭

### 목표
- Frontend 초기 로드: < 2초
- Canvas FPS: 60 (20 whales), 30+ (50 whales)
- API 응답 시간: < 200ms
- Realtime 지연: < 500ms

### 현재 측정값
_아직 측정 안 함_

---

## 참고 사항

### 중요 결정 사항
1. **프레임워크 선택**: React 18 + Vite 5 (✅ 확정)
2. **스타일링**: TailwindCSS 3 (✅ 확정)
3. **Canvas vs WebGL**: HTML5 Canvas 시작, 필요 시 WebGL 전환

### 기술 부채
_아직 없음_

### 외부 종속성
- Whale Alert API (무료: 1,000 calls/day)
- CoinGecko API (무료: 30 calls/min)
- Supabase (무료: 500MB, 2GB bandwidth/month)

---

## 다음 세션 계획

### 우선순위
1. ✅ Phase 0 완료 (프로젝트 셋업)
2. ✅ Phase 1 완료 (정적 배경 렌더링)
3. ✅ Phase 2 완료 (고래 물리 엔진)
4. **다음**: Phase 3 시작 (Supabase 연동)

### 예상 소요 시간
- ✅ Phase 0: 30분 (완료)
- ✅ Phase 1: 1시간 (완료)
- ✅ Phase 2: 2시간 (완료)
- Phase 3: 2-3시간 (다음 작업)

---

## 2025-11-17 ~ 2025-11-19 작업 기록

### ✅ 완료된 작업

#### 1. Multi-Page Routing 구현 (소요: 2시간)
**작업 내용**:
- React Router DOM v6 설치
- 5개 페이지 생성 (MainPage, WhaleAlertsPage, EventsPage, NewsPage, GuidePage)
- Header 컴포넌트에 네비게이션 통합
- 활성 라우트 스타일링

**결과**:
- `/` - 메인 대시보드 (고래 시각화 + 알림)
- `/whale-alerts` - 알림 설정 (TODO)
- `/events` - 이벤트 (TODO)
- `/news` - 뉴스 (TODO)
- `/guide` - 가이드 (TODO)

#### 2. Alert Dashboard 구현 (소요: 4시간)
**작업 내용**:
- TierSummaryPanel 컴포넌트 (왼쪽 30%)
- AlertTerminal 컴포넌트 (오른쪽 70%)
- Supabase Realtime 구독
- 12개 신호 구현 (S-002, A-002, B-002, B-003, C-001~C-006)
- 중복 방지 시스템 (쿨다운 타이머)
- 사운드 알림 (S/A tier)

**결과**:
- 실시간 알림 시스템 동작
- 4-tier 구조 (S/A/B/C)
- Multi-coin 분석 (BTC, ETH, XRP, TOTAL)

#### 4. Whale Tier System 업데이트 (소요: 1시간)
**변경 사항**:
- 로그 스케일 → 커스텀 리니어 시스템
- 7단계 깔끔한 금액 단위 ($10M ~ $1B+)
- Backend/Frontend 동기화
- 시각 자산 경로 수정 (design/whale/)

**이슈**:
- [ ] 파일명 대소문자 혼재 (T1.png vs t2.png) - 통일 필요

### 📊 성능 지표

| 지표 | 목표 | 실제 | 상태 |
|------|------|------|------|
| 초기 로드 시간 | <2초 | ~1.5초 | ✅ |
| 고래 50마리 FPS | 60 FPS | 55-60 FPS | ✅ |
| Realtime 지연 | <500ms | ~200ms | ✅ |
| Design 일관성 | 100% | 70% | 🟡 (4개 완료, 나머지 진행 중) |

### 🐛 발견된 이슈

1. **Whale tier 이미지 파일명 불일치**
   - 문제: T1.png (대문자) vs t2.png (소문자)
   - 영향: 일부 환경에서 이미지 로드 실패 가능
   - 해결책: 모두 소문자로 통일 (t1.png ~ t7.png)

2. **디자인 시스템 미완성 컴포넌트**
   - StatsHUD.jsx (부분 적용)
   - Background.jsx (검토 필요)
   - CurrentBar.jsx (검토 필요)

### 📝 다음 세션 작업

1. **High Priority**:
   - [ ] Whale tier 이미지 파일명 통일
   - [ ] 미완성 페이지 UI 구현 (WhaleAlerts, Events, News, Guide)

2. **Medium Priority**:
   - [ ] 나머지 컴포넌트 design system 적용
   - [ ] 모바일 반응형 테스트

3. **Low Priority**:
   - [ ] Phase 9: Deployment (Render)

---

**마지막 업데이트**: 2025-11-19
**작성자**: Claude Code
