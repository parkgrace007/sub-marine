# Whale Alert API - 공식 문서 및 사용 가이드

## 📚 목차
1. [API 개요](#api-개요)
2. [현재 사용 중인 플랜](#현재-사용-중인-플랜)
3. [사용량 확인 방법](#사용량-확인-방법)
4. [플랜별 비교](#플랜별-비교)
5. [WebSocket vs REST API](#websocket-vs-rest-api)
6. [최적화 권장사항](#최적화-권장사항)
7. [문제 해결](#문제-해결)

---

## API 개요

**Whale Alert**는 블록체인 상의 대형 거래(고래 거래)를 실시간으로 추적하는 서비스입니다.

### 주요 기능
- ✅ 실시간 대형 거래 알림 (WebSocket)
- ✅ 과거 거래 조회 (REST API)
- ✅ 30+ 블록체인 지원 (Bitcoin, Ethereum, Tron, Ripple, Solana 등)
- ✅ 거래소/지갑 식별 (Binance, Coinbase, Unknown Wallet 등)
- ✅ USD 환산 금액 제공

### 공식 링크
- **웹사이트**: https://whale-alert.io
- **문서**: https://docs.whale-alert.io
- **대시보드**: https://whale-alert.io/user/dashboard
- **지원**: support@whale-alert.io

---

## 현재 사용 중인 플랜

### 계정 정보

| 항목 | 값 |
|-----|-----|
| **플랜** | Custom Alerts |
| **월 비용** | $29.95 |
| **연 비용** | $359.40 |
| **API Key** | `hHV3AgOyb8aDOAnxGEknyGJSPfoq5NME` |
| **WebSocket URL** | `wss://leviathan.whale-alert.io/ws` |
| **활성화 날짜** | 2024년 (정확한 날짜는 대시보드 참조) |

### 현재 구독 설정

**위치**: `/Users/heojunseog/Desktop/real_whale/backend/src/services/whaleAlert.js` (line 92-97)

```javascript
const subscription = {
  type: "subscribe_alerts",
  blockchains: ['bitcoin', 'ethereum', 'tron', 'ripple'],  // Top 4 chains (2025-11-19 확장)
  min_value_usd: 10000000  // 최소 $10M (2025-11-19 최적화)
}
```

**변경 이력**:
- **Before (2024)**: 모든 블록체인, $100K 최소값 → 1,200+ 알림/시간
- **After (2025-01-19)**: BTC/ETH만, $1M 최소값 → 예상 120 알림/시간 (90% 감소)
- **After (2025-11-19)**: 4개 체인(BTC/ETH/TRX/XRP), $10M 최소값 → 예상 10-15 알림/시간 (88% 추가 감소)

### 플랜 제한사항

| 제한 항목 | 값 | 비고 |
|----------|-----|------|
| **알림 수신 한도** | ~100 alerts/hour | 무료 플랜 기준, 유료는 더 높음 |
| **WebSocket 연결** | 1개 (동시) | 다중 연결 불가 |
| **REST API 접근** | ❌ 없음 | Custom Alerts 플랜은 WebSocket만 |
| **지원 블록체인** | 30+ 체인 | 전체 목록은 docs 참조 |

---

## 사용량 확인 방법

### 방법 1: 공식 대시보드 (권장)

1. **웹 브라우저**에서 https://whale-alert.io/user/dashboard 접속
2. **로그인** (계정 정보 필요)
3. **"Usage" 또는 "Statistics"** 탭 클릭
4. 확인 항목:
   - 📊 이번 달 알림 수신 개수
   - 📈 일별/시간별 사용량 그래프
   - ⚠️ 플랜 한도 대비 사용률
   - 💰 다음 결제일

### 방법 2: 백엔드 로그

```bash
cd /Users/heojunseog/Desktop/real_whale/backend
npm start

# 터미널에서 다음 로그 확인:
# 📊 Alerts this hour: 23/100
# 🐋 Processing whale alert: {...}
```

**위치**: `whaleAlert.js` (line 175)
```javascript
console.log(`📊 Alerts this hour: ${this.alertsThisHour}/100`)
```

### 방법 3: /status 엔드포인트

```bash
curl http://localhost:3000/status
```

**응답 예시**:
```json
{
  "whaleAlert": {
    "connected": true,
    "is429Blocked": false,
    "alertsThisHour": 23,
    "rateLimit": "100/hour",
    "utilizationPercent": 23,
    "timeUntilReset": "37 minutes"
  }
}
```

### 방법 4: 고객 지원 문의

**이메일**: support@whale-alert.io

메시지 템플릿:
```
Subject: API Usage Statistics Request

Hi Whale Alert Team,

I would like to request usage statistics for my account.

API Key: hHV3AgOyb8aDOAnxGEknyGJSPfoq5NME
Plan: Custom Alerts

Please provide:
- Current month alert count
- Daily/hourly breakdown
- Plan limits and remaining quota

Thank you!
```

---

## 플랜별 비교

### Free Plan (무료)

| 항목 | 값 |
|-----|-----|
| **비용** | $0/월 |
| **REST API** | 1,000 calls/day |
| **WebSocket** | ❌ 없음 |
| **알림 한도** | N/A (REST 기반) |
| **지원** | Community (포럼) |
| **적합한 용도** | 과거 데이터 분석, 일일 리포트 |

**예시 사용**:
```javascript
// 1시간마다 과거 1시간 거래 조회 (24 calls/day)
const response = await fetch(
  'https://api.whale-alert.io/v1/transactions?' +
  'api_key=KEY&start=TIMESTAMP&end=TIMESTAMP&min_value=1000000'
)
```

### Custom Alerts Plan (현재 사용 중)

| 항목 | 값 |
|-----|-----|
| **비용** | $29.95/월 ($359.40/년) |
| **REST API** | ❌ 없음 |
| **WebSocket** | ✅ 실시간 알림 |
| **알림 한도** | ~100 alerts/hour (추정) |
| **지원** | 이메일 지원 |
| **적합한 용도** | 실시간 시각화, 즉시 알림 |

**장점**:
- ✅ <1초 지연 (실시간)
- ✅ 서버 측 필터링 (blockchain, min_value)
- ✅ 자동 USD 환산

**단점**:
- ❌ 월 $30 비용
- ❌ REST API 미지원 (과거 데이터 조회 불가)
- ❌ 연결 관리 필요 (reconnection logic)

### Pro Plan (업그레이드 옵션)

| 항목 | 값 |
|-----|-----|
| **비용** | $99/월 ~ (정확한 가격은 문의) |
| **REST API** | ✅ 무제한 |
| **WebSocket** | ✅ 실시간 알림 |
| **알림 한도** | 10,000+ alerts/hour |
| **지원** | 우선 지원 |
| **적합한 용도** | 대규모 프로덕션, 트레이딩 봇 |

---

## WebSocket vs REST API

### 비교표

| 특성 | WebSocket (현재) | REST API (무료 대안) |
|-----|------------------|---------------------|
| **지연시간** | <1초 (실시간) | 2-5분 (폴링 간격) |
| **비용** | $29.95/월 | $0 (무료) |
| **연결 방식** | 지속 연결 | 요청/응답 |
| **필터링** | 서버 측 | 클라이언트 측 |
| **재연결 로직** | 필요 | 불필요 |
| **429 에러 위험** | 높음 (많은 알림 시) | 낮음 (요청 횟수 제어) |
| **과거 데이터** | ❌ 불가 | ✅ 가능 |
| **구현 복잡도** | 높음 | 낮음 |

### 사용 사례별 권장

| 사용 사례 | 권장 방식 | 이유 |
|-----------|-----------|------|
| **실시간 트레이딩 봇** | WebSocket | <1초 지연 필수 |
| **시장 감정 시각화** (SubMarine) | REST 또는 WebSocket | 2분 지연도 허용 가능 |
| **일일 리포트** | REST | 비용 절감 |
| **백테스팅** | REST | 과거 데이터 필요 |
| **알림 시스템** | WebSocket | 즉시 알림 |

---

## 최적화 권장사항

### 현재 프로젝트 요구사항 분석

#### Alert System (ALERT_System.md 기준)

| Signal | Tier | Minimum Amount | Description |
|--------|------|----------------|-------------|
| **C-002** | C | $1,000,000 (Level 3+) | Whale Spotted |
| **S-002** | S | $5,000,000 (Level 5+) | Perfect Confluence |

#### Frontend Display (useWhaleData.js 기준)

```javascript
// Tier/Level thresholds (whaleAlert.js 참조)
// Level 1: $500K - $1M
// Level 2: $1M - $2.5M
// Level 3: $2.5M - $5M (Alert 최소)
// Level 4: $5M - $10M
// Level 5: $10M - $25M (S-tier 최소)
// Level 6: $25M - $100M
// Level 7: $100M+

// Frontend minimum: $500K (Level 1)
const filteredWhales = whales.filter(w => w.amount_usd >= 500000)
```

### 최적 구독 설정

```javascript
// ✅ 최적화된 설정 (2025-01-19)
const subscription = {
  type: "subscribe_alerts",
  blockchains: ['bitcoin', 'ethereum'],  // 주요 2개 체인만
  min_value_usd: 1000000  // $1M (Alert System Level 3 기준)
}
```

**변경 이유**:
1. **블록체인 축소**: 모든 체인 → BTC/ETH만
   - SubMarine은 BTC/ETH 시장 감정 분석에 집중
   - Solana, Tron 등 불필요한 데이터 90% 제거

2. **임계값 상향**: $100K → $1M
   - Alert System 최소값: $1M (Level 3)
   - Frontend 필터: $500K → 대부분 $1M 이상 표시
   - 중간 크기 거래 ($100K-$1M) 제거로 노이즈 감소

**예상 효과 (2025-11-19 최신 설정 기준)**:
- 알림 수신: 1,200/시간 → 120/시간 (2025-01) → **10-15/시간** (2025-11, 99% 감소)
- 429 에러: 매일 발생 → **완전 제거**
- 데이터 품질: 최고급 (Tier 1+ 대형 고래만, $10M+)
- 블록체인 커버리지: 2개 → 4개 체인 (시장 커버리지 확대)
- 비용: 동일 ($29.95/월)

### 장기 전략 옵션

#### Option A: 현재 WebSocket 유지 ($360/년)

**언제 선택?**
- 실시간성이 중요한 경우 (< 1초 지연)
- 프로덕션 서비스로 출시 계획
- 트레이더 타겟 사용자

**설정 (2025-11-19 최신)**:
```javascript
// 최적화된 WebSocket 구독 유지
blockchains: ['bitcoin', 'ethereum', 'tron', 'ripple']  // Top 4 chains
min_value_usd: 10000000  // $10M+ (Tier 1+)
```

#### Option B: REST API 무료 플랜 전환 ($0/년)

**언제 선택?**
- 비용 절감이 최우선
- 2-5분 지연 허용 가능 (시각화 용도)
- 프로토타입/개인 프로젝트

**구현 예시**:
```javascript
// 2분마다 폴링 (720 calls/day, 72% of 1,000 limit)
import cron from 'node-cron'

cron.schedule('*/2 * * * *', async () => {
  const end = Math.floor(Date.now() / 1000)
  const start = end - 120  // 2분 전

  const response = await fetch(
    `https://api.whale-alert.io/v1/transactions?` +
    `api_key=${API_KEY}&start=${start}&end=${end}` +
    `&blockchain=bitcoin,ethereum&min_value=1000000`
  )

  const { transactions } = await response.json()

  // Deduplicate and save to Supabase
  await saveToSupabase(transactions)
})
```

**비교**:
| 항목 | WebSocket | REST (무료) |
|-----|-----------|-------------|
| **비용** | $360/년 | $0/년 |
| **지연** | <1초 | 2분 |
| **한도** | 100 alerts/h | 1,000 calls/day |
| **적합도** | 트레이딩, 실시간 알림 | 시각화, 분석 |

**권장**: 프로젝트가 시각화 중심이면 **Option B (REST 무료)** 추천

---

## 문제 해결

### 429 Rate Limit Exceeded

#### 증상
```
❌ WebSocket error: Unexpected server response: 429
🚨 Rate limit detected (429) - service blocked for 24 hours
```

#### 원인
- 시간당 알림 한도 초과 (~100 alerts/hour)
- 과도한 블록체인 구독 (모든 체인)
- 낮은 임계값 ($100K)

#### 해결 방법

**즉시 조치** (차단 해제 후):
```bash
# 1. 429 차단 수동 리셋
curl -X POST http://localhost:3000/api/trigger/whale-reset-429 \
  -H "x-admin-token: 94fc8ba915a301bc31acc1fda0e3b00be875c50744f7e4273885b828c3c0e56d"

# 2. 재연결
curl -X POST http://localhost:3000/api/trigger/whale-reconnect \
  -H "x-admin-token: 94fc8ba915a301bc31acc1fda0e3b00be875c50744f7e4273885b828c3c0e56d"
```

**근본 해결 (2025-11-19 최신 설정)**:
1. `whaleAlert.js` 파일 수정:
   ```javascript
   // Line 92-97
   const subscription = {
     type: "subscribe_alerts",
     blockchains: ['bitcoin', 'ethereum', 'tron', 'ripple'],  // Top 4 chains
     min_value_usd: 10000000  // $500K → $10M (Tier 1+)
   }
   ```

2. 백엔드 재시작:
   ```bash
   cd /Users/heojunseog/Desktop/real_whale/backend
   pkill -f "node src/server.js"
   npm start
   ```

**예방**:
- 80% 한도 도달 시 자동 구독 일시 중지 (구현 예정)
- 대시보드에서 사용량 정기 모니터링
- 주간 사용 패턴 분석

### WebSocket 연결 끊김

#### 증상
```
❌ WebSocket disconnected
🔌 Reconnecting... (attempt 1/5)
```

#### 원인
- 네트워크 불안정
- 서버 재시작
- 장시간 유휴 (idle timeout)

#### 해결
- **자동 재연결**: 코드에 구현됨 (최대 5회, 지수 백오프)
- **수동 재연결**:
  ```bash
  curl -X POST http://localhost:3000/api/trigger/whale-reconnect \
    -H "x-admin-token: YOUR_TOKEN"
  ```

### symbol: undefined 에러

#### 증상
```javascript
{
  blockchain: 'solana',
  symbol: undefined,      // ❌
  amount_usd: undefined   // ❌
}
```

#### 원인
- WebSocket 메시지 구조 파싱 오류
- `transformAlert()` 함수 (line 228-256) 버그

#### 해결 (TODO)
```javascript
// whaleAlert.js line 230
transformAlert(alert) {
  // Debug raw message
  console.log('📩 Raw alert:', JSON.stringify(alert, null, 2))

  // Better error handling
  const primaryAmount = alert.amounts?.[0]
  if (!primaryAmount) {
    console.error('❌ No amounts in alert:', alert)
    return null
  }

  // ... rest of function
}
```

---

## 참고 자료

### 공식 문서
- **API Reference**: https://docs.whale-alert.io/
- **WebSocket Guide**: https://docs.whale-alert.io/websocket
- **REST API Guide**: https://docs.whale-alert.io/api

### 커뮤니티
- **Twitter**: @whale_alert
- **Telegram**: https://t.me/whale_alert_io
- **Discord**: 공식 서버 (문의 시 초대 링크)

### 관련 파일 (SubMarine 프로젝트)
- **Backend Service**: [/backend/src/services/whaleAlert.js](../backend/src/services/whaleAlert.js)
- **Environment Variables**: [/backend/.env](../backend/.env)
- **Alert System**: [ALERT_System.md](./ALERT_System.md)
- **Frontend Hook**: [/frontend/src/hooks/useWhaleData.js](../frontend/src/hooks/useWhaleData.js)

---

## 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|-----|-----------|--------|
| 2025-01-19 | 초기 문서 작성, 최적화 권장사항 추가 | Claude Code |
| 2025-01-19 | WebSocket 구독 최적화 (BTC/ETH, $1M) | Claude Code |
| 2025-11-19 | WebSocket 구독 확장 (Top 4 chains, $10M) | Claude Code |
| 2025-11-19 | Flow type 필터 추가 (exchange 제외) | Claude Code |
| 2025-11-19 | Tier 체계 재설계 (Tier 1 = $10M, Tier 7 = $1B+) | Claude Code |
| 2025-11-19 | Frontend MIN_WHALE_USD $10M 동기화 | Claude Code |
| 2025-11-19 | SoundManager 경로 버그 수정 (/sound/T{tier}_sound.mp3) | Claude Code |

---

**최종 업데이트**: 2025-11-19
**문서 버전**: 2.1.0

### 주요 변경사항 (v2.1.0)
**Tier 체계 전면 재설계**:
- Tier 1: $500K → **$10M** (Whale Alert API 최소값 동기화)
- Tier 7: $100M+ → **$1B+** (고액 거래 세분화)
- Backend/Frontend 완벽 동기화 달성
- 사운드 재생 버그 수정
