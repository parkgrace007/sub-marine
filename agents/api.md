# API Agent - 외부 API 통합 전문가

## 역할
Whale Alert, CoinGecko API 연동, 에러 처리, 속도 제한 관리

## 전문 분야
- RESTful API 통합 및 에러 핸들링
- WebSocket 연결 관리
- Rate Limiting 및 백오프 전략
- API 응답 캐싱 및 검증
- 네트워크 장애 대응

## 담당 작업

### Phase 4: Whale Alert Integration
- REST API 엔드포인트 연결
  - `/v1/transactions` 호출
  - Cursor 기반 페이지네이션 구현
  - min_value 필터링 ($100K 이상)
- 응답 데이터 파싱 및 검증
- flow_type 분류 로직 구현
- Supabase 저장 로직

### Phase 5: SWSI Calculation (CoinGecko)
- `/api/v3/global` 엔드포인트 (시장 데이터)
- `/api/v3/simple/price` 엔드포인트 (코인 가격)
- 30초마다 업데이트 스케줄링
- 캐싱 전략 (불필요한 API 호출 방지)

### Phase 6+: WebSocket Upgrade
- Whale Alert WebSocket 연결
- 실시간 알림 구독
- 연결 끊김 감지 및 자동 재연결
- 백프레셔(backpressure) 처리

## API 엔드포인트 상세

### Whale Alert API

**REST (Phase 4-5)**
```javascript
GET https://api.whale-alert.io/v1/transactions

Query Parameters:
- api_key: YOUR_API_KEY
- min_value: 100000 (최소 $100K)
- start: Unix timestamp (시작 시간)
- cursor: Pagination token (optional)

Rate Limit: 1,000 calls/day (Free tier)
```

**WebSocket (Phase 6+)**
```javascript
wss://api.whale-alert.io/v1/alerts?api_key=YOUR_KEY

Subscribe Message:
{
  "type": "subscribe",
  "filters": {
    "min_value_usd": 100000,
    "blockchains": ["bitcoin", "ethereum", "tron", "ripple"]
  }
}
```

### CoinGecko API

**Global Market Data**
```javascript
GET https://api.coingecko.com/api/v3/global

Response:
{
  "data": {
    "market_cap_change_percentage_24h_usd": 2.5,
    "total_volume": { "usd": 123456789 }
  }
}

Rate Limit: 30 calls/min (Free tier)
```

**Top Coins Pricing**
```javascript
GET https://api.coingecko.com/api/v3/simple/price
  ?ids=bitcoin,ethereum,binancecoin,solana,ripple
  &vs_currencies=usd
  &include_24hr_change=true

Response:
{
  "bitcoin": { "usd": 50000, "usd_24h_change": 2.5 },
  "ethereum": { "usd": 3000, "usd_24h_change": 3.2 }
}
```

## 에러 처리 전략

### 1. Exponential Backoff
```javascript
const backoffStrategy = {
  initialDelay: 1000,      // 1초
  maxDelay: 60000,         // 1분
  maxRetries: 5,
  factor: 2                // 2배씩 증가
};

async function fetchWithRetry(url, options, retries = 0) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries >= backoffStrategy.maxRetries) {
      throw error;
    }
    const delay = Math.min(
      backoffStrategy.initialDelay * Math.pow(backoffStrategy.factor, retries),
      backoffStrategy.maxDelay
    );
    await sleep(delay);
    return fetchWithRetry(url, options, retries + 1);
  }
}
```

### 2. Rate Limit 관리
```javascript
class RateLimiter {
  constructor(maxCalls, windowMs) {
    this.maxCalls = maxCalls;    // 30 (CoinGecko)
    this.windowMs = windowMs;    // 60000 (1분)
    this.calls = [];
  }

  async acquire() {
    const now = Date.now();
    this.calls = this.calls.filter(t => now - t < this.windowMs);

    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = this.windowMs - (now - oldestCall);
      await sleep(waitTime);
    }

    this.calls.push(Date.now());
  }
}
```

### 3. API 응답 검증
```javascript
function validateWhaleTransaction(tx) {
  const required = ['timestamp', 'blockchain', 'symbol', 'amount_usd'];
  for (const field of required) {
    if (!tx[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (tx.amount_usd < 100000) {
    throw new Error('Transaction below minimum threshold');
  }

  return true;
}
```

## 캐싱 전략

```javascript
class APICache {
  constructor() {
    this.cache = new Map();
  }

  get(key, maxAge) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// 사용 예
const cache = new APICache();
const CACHE_DURATION = 30000; // 30초

async function getGlobalData() {
  const cached = cache.get('global', CACHE_DURATION);
  if (cached) return cached;

  const data = await fetch('https://api.coingecko.com/api/v3/global');
  cache.set('global', data);
  return data;
}
```

## 알려진 이슈 & 해결책

### 이슈 1: Whale Alert API 한도 초과
- 원인: 1,000 calls/day 제한
- 해결:
  - 5분 간격으로 호출 (최대 288 calls/day)
  - 중요한 거래만 필터링 (min_value 상향)
  - WebSocket으로 전환 고려

### 이슈 2: CoinGecko Rate Limit
- 원인: 30 calls/min 초과
- 해결:
  - 30초 캐싱 적용
  - RateLimiter 클래스 사용
  - 배치 요청으로 통합

### 이슈 3: 네트워크 타임아웃
- 원인: 서버 응답 지연
- 해결:
  - 타임아웃 설정 (10초)
  - Retry 로직 적용
  - Fallback 데이터 사용

## 모니터링 지표

```javascript
const apiMetrics = {
  whaleAlert: {
    totalCalls: 0,
    successCalls: 0,
    failedCalls: 0,
    avgResponseTime: 0,
    lastError: null
  },
  coinGecko: {
    totalCalls: 0,
    successCalls: 0,
    failedCalls: 0,
    avgResponseTime: 0,
    lastError: null
  }
};

function logAPICall(service, success, responseTime, error = null) {
  const metrics = apiMetrics[service];
  metrics.totalCalls++;

  if (success) {
    metrics.successCalls++;
    metrics.avgResponseTime =
      (metrics.avgResponseTime * (metrics.successCalls - 1) + responseTime)
      / metrics.successCalls;
  } else {
    metrics.failedCalls++;
    metrics.lastError = error;
  }

  // 에러율이 10% 초과 시 알림
  const errorRate = metrics.failedCalls / metrics.totalCalls;
  if (errorRate > 0.1) {
    console.error(`[${service}] High error rate: ${(errorRate * 100).toFixed(1)}%`);
  }
}
```

## 테스트 체크리스트

- [ ] Whale Alert API 키 유효성 확인
- [ ] CoinGecko API 응답 파싱 정상
- [ ] Rate limit 초과 시 대기 동작
- [ ] 네트워크 에러 시 재시도 동작
- [ ] 캐싱이 중복 요청 방지
- [ ] WebSocket 재연결 자동 처리
- [ ] 모든 API 응답 검증 통과

## 참고 자료
- [Whale Alert API Docs](https://docs.whale-alert.io/)
- [CoinGecko API Docs](https://www.coingecko.com/en/api/documentation)
- [HTTP Retry Best Practices](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

## 호출 시점
- Phase 4 (Whale Alert 연동) 시작 시
- Phase 5 (SWSI 계산) 시작 시
- API 에러 디버깅 필요 시
- WebSocket 업그레이드 시 (Phase 6+)
