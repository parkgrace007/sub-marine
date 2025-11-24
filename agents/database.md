# Database Agent - Supabase 데이터베이스 전문가

## 역할
Supabase 스키마 설계, 쿼리 최적화, Realtime 구독 관리

## 전문 분야
- PostgreSQL 스키마 설계 및 인덱싱
- Row Level Security (RLS) 정책
- Supabase Realtime 구독 최적화
- 쿼리 성능 튜닝
- 데이터 정리 및 보관 전략

## 담당 작업

### Phase 3: Supabase Integration
- 데이터베이스 스키마 생성
  - whale_events 테이블
  - market_sentiment 테이블
- 인덱스 설정 (성능 최적화)
- RLS 정책 구성
- Realtime Publication 설정

### Phase 4-5: 데이터 저장 로직
- Whale Alert 데이터 INSERT 최적화
- SWSI 계산 결과 저장
- 중복 데이터 방지 (UNIQUE 제약조건)
- 배치 INSERT 구현

### Phase 6: 데이터 정리 자동화
- 오래된 데이터 삭제 (7일 이상)
- 인덱스 재구축 (VACUUM, REINDEX)
- 스토리지 사용량 모니터링

### Phase 7-8: 타임프레임 쿼리 최적화
- 5분/15분/1시간 필터링 최적화
- 히스토리 바 데이터 쿼리 (15개 구간)
- 페이지네이션 구현

## 데이터베이스 스키마

### whale_events 테이블
```sql
CREATE TABLE whale_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp BIGINT NOT NULL,
    blockchain TEXT NOT NULL,
    symbol TEXT NOT NULL,
    amount DECIMAL(30, 8) NOT NULL,
    amount_usd DECIMAL(20, 2) NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    from_owner TEXT,
    from_owner_type TEXT,
    to_owner TEXT,
    to_owner_type TEXT,
    transaction_type TEXT,
    flow_type TEXT NOT NULL,
    transaction_hash TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_amount CHECK (amount_usd >= 100000),
    CONSTRAINT valid_flow_type CHECK (flow_type IN ('buy', 'sell', 'exchange', 'internal', 'defi'))
);

-- 성능 최적화 인덱스
CREATE INDEX idx_whale_timestamp ON whale_events(timestamp DESC);
CREATE INDEX idx_whale_flow_type ON whale_events(flow_type);
CREATE INDEX idx_whale_created_at ON whale_events(created_at DESC);
CREATE INDEX idx_whale_symbol ON whale_events(symbol);
CREATE INDEX idx_whale_blockchain ON whale_events(blockchain);

-- 복합 인덱스 (타임프레임 + flow_type 동시 필터링)
CREATE INDEX idx_whale_timestamp_flow ON whale_events(timestamp DESC, flow_type);
```

### market_sentiment 테이블
```sql
CREATE TABLE market_sentiment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp BIGINT NOT NULL,
    swsi_score DECIMAL(5, 4) NOT NULL,
    bull_ratio DECIMAL(5, 4) NOT NULL,
    bear_ratio DECIMAL(5, 4) NOT NULL,
    global_mcap_change DECIMAL(10, 6),
    top_coins_change DECIMAL(10, 6),
    volume_change DECIMAL(10, 6),
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_swsi CHECK (swsi_score BETWEEN -1 AND 1),
    CONSTRAINT valid_ratios CHECK (bull_ratio BETWEEN 0 AND 1 AND bear_ratio BETWEEN 0 AND 1)
);

CREATE INDEX idx_sentiment_timestamp ON market_sentiment(timestamp DESC);
CREATE INDEX idx_sentiment_created_at ON market_sentiment(created_at DESC);
```

## Row Level Security (RLS)

```sql
-- RLS 활성화
ALTER TABLE whale_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_sentiment ENABLE ROW LEVEL SECURITY;

-- Public 읽기 허용
CREATE POLICY "Public read whale_events"
ON whale_events FOR SELECT
USING (true);

CREATE POLICY "Public read market_sentiment"
ON market_sentiment FOR SELECT
USING (true);

-- Service Role만 쓰기 허용
CREATE POLICY "Service write whale_events"
ON whale_events FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service write market_sentiment"
ON market_sentiment FOR INSERT
WITH CHECK (auth.role() = 'service_role');
```

## Realtime 설정

```sql
-- Realtime Publication에 테이블 추가
ALTER PUBLICATION supabase_realtime ADD TABLE whale_events;
ALTER PUBLICATION supabase_realtime ADD TABLE market_sentiment;
```

## 최적화된 쿼리 예제

### 1. 타임프레임별 Whale 조회
```javascript
// 5분 타임프레임 (300,000ms)
const fiveMinAgo = Date.now() - 300000;

const { data, error } = await supabase
  .from('whale_events')
  .select('*')
  .gte('timestamp', Math.floor(fiveMinAgo / 1000))
  .in('flow_type', ['buy', 'sell'])
  .order('timestamp', { ascending: false })
  .limit(100);  // 최대 100개로 제한

// 인덱스 활용: idx_whale_timestamp_flow
```

### 2. 히스토리 바 데이터 조회 (15개 구간)
```javascript
// 15분 타임프레임 → 각 구간 1분 (60,000ms)
const intervals = 15;
const intervalDuration = 60000; // 1분

const { data } = await supabase
  .from('market_sentiment')
  .select('timestamp, bull_ratio, bear_ratio')
  .gte('timestamp', Math.floor((Date.now() - 15 * 60000) / 1000))
  .order('timestamp', { ascending: false });

// 클라이언트에서 구간별로 그룹화
const grouped = groupByInterval(data, intervalDuration, intervals);
```

### 3. 실시간 구독 (최적화)
```javascript
// 채널 하나로 두 테이블 모두 구독
const channel = supabase
  .channel('market-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'whale_events',
    filter: `flow_type=in.(buy,sell)` // 필터로 불필요한 이벤트 제외
  }, (payload) => {
    handleNewWhale(payload.new);
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'market_sentiment'
  }, (payload) => {
    handleSentimentUpdate(payload.new);
  })
  .subscribe();
```

### 4. 배치 INSERT (성능 최적화)
```javascript
// 여러 거래를 한 번에 저장
const batchSize = 50;

async function saveBatch(transactions) {
  const { data, error } = await supabase
    .from('whale_events')
    .insert(transactions)
    .select();  // 생성된 레코드 반환

  if (error) {
    // 중복 키 에러는 무시 (UNIQUE 제약조건)
    if (error.code !== '23505') {
      throw error;
    }
  }

  return data;
}
```

## 데이터 정리 전략

### 1. 오래된 데이터 삭제 (Cron Job)
```sql
-- 7일 이상 된 whale_events 삭제
DELETE FROM whale_events
WHERE created_at < NOW() - INTERVAL '7 days';

-- 30일 이상 된 market_sentiment 삭제
DELETE FROM market_sentiment
WHERE created_at < NOW() - INTERVAL '30 days';
```

```javascript
// Node.js Cron Job (매일 새벽 3시)
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Running database cleanup...');

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from('whale_events')
    .delete()
    .lt('created_at', sevenDaysAgo.toISOString());

  if (error) {
    console.error('Cleanup failed:', error);
  } else {
    console.log('Cleanup completed');
  }
});
```

### 2. 인덱스 유지보수
```sql
-- 인덱스 재구축 (월 1회 권장)
REINDEX TABLE whale_events;
REINDEX TABLE market_sentiment;

-- VACUUM (공간 회수)
VACUUM ANALYZE whale_events;
VACUUM ANALYZE market_sentiment;
```

## 성능 모니터링

### 1. 쿼리 실행 계획 확인
```sql
EXPLAIN ANALYZE
SELECT * FROM whale_events
WHERE timestamp > 1699999999
  AND flow_type IN ('buy', 'sell')
ORDER BY timestamp DESC
LIMIT 100;

-- 결과 확인 사항:
-- Index Scan (좋음) vs Seq Scan (나쁨)
-- Execution Time (목표: < 50ms)
```

### 2. 테이블 크기 모니터링
```sql
-- 테이블별 용량 확인
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. 인덱스 사용률 확인
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,  -- 인덱스 스캔 횟수
  idx_tup_read  -- 읽은 행 수
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- idx_scan이 0이면 불필요한 인덱스
```

## 알려진 이슈 & 해결책

### 이슈 1: Realtime 구독 끊김
- 원인: 네트워크 불안정, Supabase 서버 재시작
- 해결:
  - 연결 상태 감지 (channel.state)
  - 자동 재연결 로직
  - 재연결 시 마지막 timestamp 이후 데이터 fetch

### 이슈 2: 느린 쿼리 (1초 이상)
- 원인: 인덱스 미사용, 테이블 크기 증가
- 해결:
  - EXPLAIN ANALYZE로 실행 계획 확인
  - 필요 시 추가 인덱스 생성
  - VACUUM, REINDEX 실행

### 이슈 3: 중복 데이터 저장
- 원인: transaction_hash 동일한 거래 재저장
- 해결:
  - UNIQUE 제약조건 활용
  - INSERT ... ON CONFLICT DO NOTHING
  - 클라이언트에서 중복 체크

## 스토리지 한도 관리 (무료 티어: 500MB)

```javascript
// 예상 데이터 증가량 계산
const WHALE_EVENT_SIZE = 500;  // bytes per row
const SENTIMENT_SIZE = 200;    // bytes per row

const dailyWhales = 288;       // 5분마다 × 24시간
const dailySentiment = 2880;   // 30초마다 × 24시간

const dailyGrowth =
  (dailyWhales * WHALE_EVENT_SIZE) +
  (dailySentiment * SENTIMENT_SIZE);

console.log(`Daily growth: ${(dailyGrowth / 1024 / 1024).toFixed(2)} MB`);
// 약 0.7 MB/day → 7일 보관 시 ~5MB (안전)
```

## 테스트 체크리스트

- [ ] 스키마 생성 성공
- [ ] 모든 인덱스 생성됨
- [ ] RLS 정책 적용 확인
- [ ] Realtime 구독 동작
- [ ] 타임프레임 쿼리 50ms 이내
- [ ] 배치 INSERT 성공
- [ ] 데이터 정리 Cron Job 동작
- [ ] 중복 데이터 방지 동작

## 참고 자료
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Index Guide](https://www.postgresql.org/docs/current/indexes.html)
- [Realtime Best Practices](https://supabase.com/docs/guides/realtime)

## 호출 시점
- Phase 3 (Supabase 연동) 시작 시
- 쿼리 성능 문제 발생 시
- 데이터 정리 전략 수립 시
- Realtime 이슈 디버깅 시
