# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# ⚓ SubMarine - 개발 빠른 참조 가이드

## 프로젝트 개요

**목적**: 암호화폐 대형 거래(Whale)와 시장 감정을 실시간 시각화하는 웹 애플리케이션

**핵심 기능**:
- 배경: SWSI 지표 기반 시장 매수/매도 강도 표시 (파란색/빨간색 그라데이션)
- 고래 레이어: Boids 물리 엔진 기반 개별 대형 거래 흐름 시각화
- 타임프레임: 5분 / 15분 / 1시간 선택 가능

**타겟 사용자**: 암호화폐 트레이더, 마켓 분석가, 데이터 시각화 애호가

---

## 기술 스택

### Frontend
- React + Vite (또는 Vanilla JS)
- TailwindCSS
- HTML5 Canvas (물리 엔진)
- Supabase Client (Realtime)

### Backend
- Node.js + Express
- node-cron (스케줄링)
- Supabase Client (Service Role)

### Database & APIs
- Supabase (PostgreSQL + Realtime)
- Whale Alert API (거래 데이터)
- CoinGecko API (시장 데이터)

---

## 시스템 아키텍처

```
Frontend (React) ←→ Supabase (Realtime DB)
                         ↑
Backend (Node.js) ───────┘
   ├── Whale Alert API (5분마다)
   └── CoinGecko API (30초마다)
```

---

## 핵심 데이터 모델

### 1. whale_events 테이블
```sql
- timestamp (거래 시간)
- blockchain, symbol (체인, 코인)
- amount, amount_usd (금액)
- from_address, to_address
- from_owner_type, to_owner_type (거래소/지갑 구분)
- flow_type (buy/sell/exchange/internal/defi)
```

### 2. market_sentiment 테이블
```sql
- timestamp
- swsi_score (-1 ~ +1)
- bull_ratio, bear_ratio (0 ~ 1)
- global_mcap_change, top_coins_change, volume_change
```

### Flow Type 분류 로직
- **Sell**: wallet → exchange
- **Buy**: exchange → wallet
- **Exchange**: exchange ↔ exchange
- **Internal**: wallet ↔ wallet
- **DeFi**: contract 관련

---

## SWSI 알고리즘 (간단 버전)

```javascript
// 3가지 지표를 가중평균하여 -1 ~ +1 계산
G = 글로벌 시가총액 변화 (1시간) → 5% 변화 = ±1
B = 주요 코인 평균 변화 (BTC, ETH, BNB, SOL, XRP)
V = 거래량 변화 (현재 vs 7일 평균)

S_raw = 0.5*G + 0.3*B + 0.2*V
S = EMA smoothing (α=0.1)

bull_ratio = (S + 1) / 2
bear_ratio = 1 - bull_ratio
```

**업데이트 주기**: 30초

---

## 고래 물리 엔진 (Boids)

### 핵심 동작
1. **Separation**: 다른 고래와 충돌 회피
2. **Alignment**: 인근 고래들과 방향 맞추기
3. **Cohesion**: 그룹 중심으로 모이기
4. **Seek**: 목표 지점(중앙선)으로 이동
5. **Boundary**: 프레임 밖으로 나가지 않기

### 크기 계산 (커스텀 리니어 시스템) - 2025-11-19 업데이트

**SubMarine 커스텀 Tier 체계 (깔끔한 금액 단위)**:
- Tier 1: $10M - $20M = 8-15px (API 최소값)
- Tier 2: $20M - $50M = 15-25px
- Tier 3: $50M - $100M = 25-35px
- Tier 4: $100M - $200M = 35-45px
- Tier 5: $200M - $500M = 45-52px
- Tier 6: $500M - $1B = 52-58px
- Tier 7: $1B+ = 58-60px (레전더리 고래, 상한 없음)

**공식** (커스텀 리니어 분류):
```javascript
// Custom tier assignment with round number boundaries
if (amountUSD >= 1000000000) tier = 7      // $1B+
else if (amountUSD >= 500000000) tier = 6  // $500M-$1B
else if (amountUSD >= 200000000) tier = 5  // $200M-$500M
else if (amountUSD >= 100000000) tier = 4  // $100M-$200M
else if (amountUSD >= 50000000) tier = 3   // $50M-$100M
else if (amountUSD >= 20000000) tier = 2   // $20M-$50M
else tier = 1                               // $10M-$20M

// Linear size interpolation
normalized = (amountUSD - 10000000) / (1000000000 - 10000000)
size = 8 + normalized * (60 - 8)
```

**변경사항**:
- 로그 스케일 → **커스텀 리니어 시스템** (SubMarine 고유)
- Tier 1: $10M-$20M (깔끔한 단위로 시작)
- Tier 7: $1B+ (직관적인 구분)
- Backend/Frontend 완벽 동기화 유지

### 수명 관리
- 5분: 300초
- 15분: 900초
- 1시간: 3,600초

---

## 개발 단계 (9단계)

### Phase 0: 프로젝트 셋업 (30분)
- 폴더 구조, package.json, .env.example 생성

### Phase 1: 정적 배경 (2-3시간)
- 파란색/빨간색 그라데이션 렌더링
- 히스토리 바 15줄 표시
- 반응형 레이아웃

### Phase 2: 고래 물리 엔진 (4-5시간)
- Boids 알고리즘 구현
- 더미 데이터로 테스트
- 60 FPS 유지

### Phase 3: Supabase 연동 (2-3시간)
- DB 스키마 생성
- Realtime 구독 설정
- 더미 데이터 CRUD 테스트

### Phase 4: Whale Alert 연동 (3-4시간)
- REST API로 거래 데이터 가져오기
- flow_type 분류 로직 구현
- Supabase에 저장

### Phase 5: SWSI 계산 (3-4시간)
- CoinGecko API로 시장 데이터 가져오기
- SWSI 알고리즘 구현
- 배경색 실시간 업데이트

### Phase 6: 자동화 & 스케줄링 (2-3시간)
- Express 서버 구축
- Cron Job 설정
  - SWSI: 30초마다
  - Whale Alert: 5분마다
  - DB 정리: 매일 새벽 3시

### Phase 7: 타임프레임 기능 (2시간)
- 5분/15분/1시간 버튼 동작
- 고래 수명 관리
- 히스토리 바 간격 조정

### Phase 8: UX 개선 (3-4시간)
- 모바일/태블릿/데스크톱 반응형
- HUD 통계 위젯
- 로딩/에러 상태 처리

### Phase 9: 배포 (2시간)
- Render 배포
- 환경변수 설정
- 24시간 안정성 테스트

---

## 프로젝트 구조

```
submarine/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Background.jsx
│   │   │   ├── HistoryBars.jsx
│   │   │   ├── WhaleCanvas.jsx
│   │   │   └── HUD.jsx
│   │   ├── physics/
│   │   │   ├── Whale.js
│   │   │   └── WhaleManager.js
│   │   ├── hooks/
│   │   │   ├── useWhaleData.js
│   │   │   └── useSentiment.js
│   │   ├── utils/
│   │   │   └── supabase.js
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── whaleAlert.js
│   │   │   └── swsi.js
│   │   ├── utils/
│   │   │   └── supabase.js
│   │   └── server.js
│   ├── scripts/
│   │   ├── fetchWhales.js
│   │   └── calculateSWSI.js
│   └── package.json
├── Docs/
│   └── PRD.md
└── CLAUDE.md (이 파일)
```

---

## 빠른 시작

### 필수 계정 (모두 무료)
1. **Whale Alert**: https://docs.whale-alert.io/ (1,000 calls/day)
2. **Supabase**: PostgreSQL + Realtime (500MB)
3. **CoinGecko**: Free API (30 calls/min)

### 환경변수 설정

**Frontend (.env)**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Backend (.env)**
```
WHALE_ALERT_API_KEY=your_whale_alert_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=3000
```

### 실행 명령어

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm start

# 수동 데이터 가져오기 (테스트용)
node backend/scripts/fetchWhales.js
node backend/scripts/calculateSWSI.js
```

---

## 성공 지표

### 기술적 지표
- 성능: 50마리 고래에서 60 FPS 유지
- 가동시간: 99% (백엔드)
- API 에러율: <1%
- 초기 로드 시간: <2초

### 데이터 품질
- SWSI 정확도: -1 ~ +1 범위 유지
- Flow 분류 정확도: >95%
- Realtime 지연시간: <500ms

---

## 주요 리스크 & 대응

| 리스크 | 확률 | 영향 | 대응책 |
|--------|------|------|--------|
| Whale Alert 요청 한도 초과 | 높음 | 중간 | 캐싱, REST → WebSocket 전환 |
| Canvas 성능 문제 | 중간 | 높음 | requestAnimationFrame, 고래 수 제한 |
| Supabase 무료 한도 | 중간 | 중간 | 사용량 모니터링, 정리 작업 |

---

## 참고 자료

### 외부 API 문서
- **Whale Alert Docs**: https://docs.whale-alert.io/
- **Supabase Docs**: https://supabase.com/docs
- **CoinGecko API**: https://www.coingecko.com/en/api

### 기술 문서
- **Boids Algorithm**: https://en.wikipedia.org/wiki/Boids
- **Canvas 최적화**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas

### 내부 문서
- **False Positive Prevention**: [Docs/FALSE_POSITIVE_PREVENTION.md](Docs/FALSE_POSITIVE_PREVENTION.md) - 거짓 신호 방지 시스템
- **Indicator Classification**: [Docs/INDICATOR_CLASSIFICATION.md](Docs/INDICATOR_CLASSIFICATION.md) - RSI/BB/MACD 분류 체계
- **PRD**: [Docs/PRD.md](Docs/PRD.md) - 제품 요구사항 명세
- **TASK**: [Docs/TASK.md](Docs/TASK.md) - 작업 진행 상황

---

## 개발 워크플로우

### 작업 시작 전 필수 확인
1. **[Docs/TASK.md](Docs/TASK.md) 읽기** - 현재 진행 상황과 Phase 확인
2. **해당 Phase의 성공 기준 확인** - [Docs/PRD.md](Docs/PRD.md)에서 상세 스펙 확인
3. **필요 시 전문 에이전트 활용** - [agents/](agents/) 폴더의 전문 에이전트 참조

### 작업 완료 후 필수 작업
1. **[Docs/TASK.md](Docs/TASK.md) 업데이트**
   - 완료한 작업 체크
   - 발생한 이슈 기록
   - 다음 작업 우선순위 업데이트
2. **성공 기준 달성 확인** - PRD의 각 Phase 체크리스트 완료 여부 확인

### 전문 에이전트 활용
- **Physics Agent** ([agents/physics.md](agents/physics.md)): Phase 2, 7 - Boids 물리 엔진
- **API Agent** ([agents/api.md](agents/api.md)): Phase 4, 5, 6 - Whale Alert, CoinGecko 연동
- **Database Agent** ([agents/database.md](agents/database.md)): Phase 3, 6 - Supabase DB 설정
- **UX Agent** ([agents/ux.md](agents/ux.md)): Phase 1, 7, 8 - 반응형 UI/UX
- **Deployment Agent** ([agents/deployment.md](agents/deployment.md)): Phase 9 - Render 배포

---

## 최근 완성 기능 (2025-11-17 ~ 2025-11-19)

### 1. Multi-Page Routing (React Router DOM)
- 5개 페이지: Main, WhaleAlerts, Events, News, Guide
- Header 네비게이션 통합
- 활성 라우트 하이라이팅

### 2. Alert Dashboard System
- 4-tier 알림 (S/A/B/C)
- 12개 구현된 신호 (ALERT_System.md 참조)
- Dual-panel layout: TierSummaryPanel(30%) + AlertTerminal(70%)
- Supabase Realtime 실시간 구독
- S/A tier 사운드 알림

### 4. Custom Whale Tier System (2025-11-19)
**로그 스케일 → 커스텀 리니어로 변경**:
- Tier 1: $10M-$20M (8-15px)
- Tier 2: $20M-$50M (15-25px)
- Tier 3: $50M-$100M (25-35px)
- Tier 4: $100M-$200M (35-45px)
- Tier 5: $200M-$500M (45-52px)
- Tier 6: $500M-$1B (52-58px)
- Tier 7: $1B+ (58-60px)

**시각 자산**: design/whale/ (t1.png ~ t7.png)
**이슈**: 파일명 대소문자 혼재 (T1.png vs t2.png) - 통일 필요

### 5. Time-Weighted Whale Analysis (2025-11-22)
**기존 문제**: 과거 고래 매수 + 현재 가격 하락 → 거짓 "다이버전스" 신호

**해결책**: **시간 가중 평균 (Exponential Decay)**
- 최근 거래일수록 높은 가중치 적용 (6시간 half-life)
- 1시간 전 = 85% 가중치
- 3시간 전 = 61% 가중치
- 6시간 전 = 37% 가중치
- 12시간 전 = 14% 가중치

**구현 위치**:
- `frontend/src/utils/alertComboTransformer.js` - `getWhaleData()` 함수
- 공식: `weight = Math.exp(-ageHours / 6)`

**강화된 조건 (A-01: SMART DIVERGENCE)**:
1. ✅ 가격 하락 중 (`price_change_weighted < 0` - 6시간 시간 가중)
2. ✅ 최소 $30M 순매수 (시간 가중)
3. ✅ **매수 절대값 최소 $50M** (통계 유의성)
4. ✅ **매도 절대값 최소 $20M** (통계 유의성)
5. ✅ 매수/매도 비율 1.5배 이상
6. ✅ Tier 5+ 고래 포함 ($200M+)
7. ✅ RSI 저점권 (Level 4 이하)

**효과**:
- 거짓 신호 감소 (과거 데이터 영향 최소화)
- 고래 활동의 "모멘텀" 정확히 포착
- 시간 동기화로 가격 변화와 고래 흐름 일치
- 통계적 유의성 확보 (샘플 사이즈 최소값)

---

## 중요 아키텍처 결정 (변경 금지 ⚠️)

### 1. Whale Alert API: WebSocket (NOT REST)
- 이유: 실시간 성능 향상
- 위치: backend/src/services/whaleAlert.js

### 2. Custom Whale Tier System
- SubMarine만의 7단계 시스템
- 로그 스케일로 되돌리지 말것

### 3. Time-Weighted Whale Analysis (2025-11-22 추가)
- 시간 가중치 필수 사용 (6시간 half-life)
- 단순 합산 방식으로 되돌리지 말것
- 이유: 가격 변화와 고래 흐름 시간 동기화 필수

### 4. False Positive Prevention (2025-11-22 추가)
- **Flow Type Filtering**: 'buy', 'sell'만 카운트 ('exchange', 'internal', 'defi' 제외)
- **Temporal Alignment**: 가격 변화와 고래 데이터 동일 시간창 (6시간)
- **Statistical Significance**: 최소 절대값 임계값 적용 ($50M/$20M)
- **MACD Strength**: macd.level >= 5 (histogram >0.05%) 필수
- 상세 문서: [Docs/FALSE_POSITIVE_PREVENTION.md](Docs/FALSE_POSITIVE_PREVENTION.md)
- 이유: 사용자 청산 방지, 신호 정확도 향상

### 5. CSS Variables for Design System
- Tailwind arbitrary values 사용 금지
- 반드시 var(--color-xxx) 형식 사용

### 6. No State Management Library
- React hooks만 사용 (useState, useEffect, useMemo)
- Redux/MobX 도입 불필요

### 7. Supabase Realtime (No Polling)
- 폴링 방식 절대 금지
- 구독 방식 유지

---

## 현재 상태

**Phase**: Phase 8 완료 (UX 폴리싱 완료)
**진행률**: 100% (Core features complete)
**마지막 업데이트**: 2025-11-22

**완료된 주요 기능**:
- ✅ Phase 0-8 (PRD 기준 100%)
- ✅ Multi-page routing (5 pages)
- ✅ Design system migration (4 major components)
- ✅ Alert Dashboard (12 signals)
- ✅ Custom whale tier system
- ✅ Time-weighted whale analysis (2025-11-22)

**다음 작업**:
- Phase 9: Deployment (Render)
- 미완성 페이지 구현 (WhaleAlerts, Events, News, Guide)
- 나머지 컴포넌트 design system 적용 (StatsHUD, Background, CurrentBar)
- Whale tier 이미지 파일명 통일 (T1.png → t1.png)

---

**전체 문서**: [Docs/PRD.md](Docs/PRD.md)
**작업 로그**: [Docs/TASK.md](Docs/TASK.md)
