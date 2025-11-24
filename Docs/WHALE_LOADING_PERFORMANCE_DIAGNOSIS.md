# 고래 로딩 성능 진단 보고서

**날짜**: 2025-11-22
**문제**: 페이지 이동/새로고침 시 고래가 제자리에 위치하기까지 5-10초 소요
**목표**: 1-2초 이내로 단축

---

## 📊 진단 결과

### 1. 이미지 로딩 ✅ **정상**

**검사 결과**:
```
tier1.png: 4.1KB
tier2.png: 4.2KB
tier3.png: 1.7KB
tier4.png: 5.4KB
tier5.png: 7.3KB
tier6.png: 5.3KB
tier7.png: 8.2KB
─────────────────
총합: ~36KB
```

**결론**: 이미지 파일 크기는 매우 작아 병목이 아님 (총 36KB는 0.1초 이내 로드)

---

### 2. Supabase 쿼리 ⚠️ **주요 병목 #1**

**위치**: `frontend/src/hooks/useWhaleData.js:43-50`

**문제점**:
```javascript
// 30일치 데이터를 모두 가져옴
const thirtyDaysAgo = Math.floor((Date.now() - THIRTY_DAYS_MS) / 1000)

const { data, error: fetchError } = await supabase
  .from('whale_events')
  .select('*')
  .gte('timestamp', thirtyDaysAgo)  // ← 30일 전부터 현재까지
  .gte('amount_usd', MIN_WHALE_USD)  // $10M+
  .order('timestamp', { ascending: false })
```

**예상 데이터 량**:
- **가정**: 하루 평균 50건의 $10M+ 거래
- **30일**: 50 × 30 = **1,500건**
- **각 레코드**: ~500 bytes (timestamp, blockchain, symbol, amount, hash, addresses 등)
- **총 데이터**: 1,500 × 500 bytes = **~750KB**

**쿼리 시간 예상**:
- Supabase Free tier: **2-4초** (네트워크 포함)
- 이것만으로도 이미 목표의 2배 초과!

---

### 3. 고래 스폰 ⚠️ **주요 병목 #2**

**위치**: `frontend/src/components/WhaleCanvas.jsx:121-139`

**문제점**:
```javascript
// 처음 로드 시 30일치 고래를 한번에 스폰
whales.forEach((dbWhale) => {
  if (!syncedWhaleIdsRef.current.has(dbWhale.id)) {
    manager.spawnFromEvent(dbWhale, canvas.width, canvas.height, targetXRatio, timeframe)
    syncedWhaleIdsRef.current.add(dbWhale.id)
  }
})
```

**예상 소요 시간**:
- 1,500마리 고래 × 0.5ms/마리 = **~750ms**
- 각 고래마다:
  - Whale 객체 생성
  - 위치 계산
  - 사운드 재생 (tier별)
  - 메타데이터 저장

---

### 4. 물리 엔진 계산 ⚠️ **주요 병목 #3**

**위치**: `frontend/src/physics/Whale.js:239-297` (`separate` 함수)

**문제점**:
```javascript
// O(n²) 복잡도 - 모든 고래 쌍을 검사
for (let other of whales) {
  if (other === this) continue
  const otherPos = other.getPixelPosition(canvasWidth, canvasHeight)
  const distance = this.distance(myPos, otherPos)

  if (distance > 0 && distance < perceptionRadius) {
    // 충돌 회피 계산
  }
}
```

**성능 영향**:
- **가시 고래 수**: 1시간 타임프레임 기준 ~100마리
- **계산 횟수**: 100 × 100 = 10,000회/프레임
- **60 FPS**: 10,000 × 60 = **600,000 계산/초**

**초기 로딩 시나리오**:
1. 1,500마리 고래 스폰 완료
2. 첫 프레임 물리 계산: 1,500² = **2,250,000 계산**
3. 브라우저 멈춤 (프레임 드롭) → **2-3초**

---

## 🎯 병목 원인 요약

| 병목 | 예상 소요 시간 | 영향도 |
|------|----------------|--------|
| 1. Supabase 쿼리 (30일치 데이터) | **2-4초** | 🔴 높음 |
| 2. 고래 스폰 (1,500마리 한번에) | **0.5-1초** | 🟡 중간 |
| 3. 물리 엔진 초기 계산 (1,500² 연산) | **2-3초** | 🔴 높음 |
| 4. 이미지 로딩 (36KB) | **0.1초** | 🟢 낮음 |
| **총합** | **~5-8초** | **목표: 1-2초** |

---

## 💡 최적화 방안

### 방안 1: Supabase 쿼리 최적화 (우선순위: 🔴 높음)

**현재**: 30일치 데이터 모두 가져옴
**개선**: 현재 타임프레임 + 2배 버퍼만 가져옴

**구현**:
```javascript
// useWhaleData.js 수정
const BUFFER_MULTIPLIER = 2 // 2배 버퍼 (안전 마진)

async function fetchWhales() {
  const timeframeDuration = TIMEFRAME_DURATIONS_MS[timeframe]
  const fetchWindow = timeframeDuration * BUFFER_MULTIPLIER // 1h → 2h, 4h → 8h
  const cutoff = Math.floor((Date.now() - fetchWindow) / 1000)

  const { data, error: fetchError } = await supabase
    .from('whale_events')
    .select('*')
    .gte('timestamp', cutoff)  // ← 2-8시간 전 (타임프레임별)
    .gte('amount_usd', MIN_WHALE_USD)
    .order('timestamp', { ascending: false })
    .limit(200)  // 최대 200마리 (추가 안전장치)
}
```

**효과**:
- 1h 타임프레임: 1,500 → **~10-20마리** (95% 감소)
- 쿼리 시간: 2-4초 → **0.3-0.5초** (85% 단축)

---

### 방안 2: 점진적 스폰 (Progressive Loading) (우선순위: 🟡 중간)

**현재**: 1,500마리 한번에 스폰
**개선**: 가장 최근 고래부터 점진적으로 스폰

**구현**:
```javascript
// WhaleCanvas.jsx 수정
const SPAWN_BATCH_SIZE = 20 // 한번에 20마리씩
const SPAWN_INTERVAL_MS = 50 // 50ms마다

useEffect(() => {
  if (!managerRef.current || !canvasRef.current || loading) return

  let spawnIndex = 0
  const interval = setInterval(() => {
    const batch = whales.slice(spawnIndex, spawnIndex + SPAWN_BATCH_SIZE)

    batch.forEach((dbWhale) => {
      if (!syncedWhaleIdsRef.current.has(dbWhale.id)) {
        manager.spawnFromEvent(dbWhale, ...)
        syncedWhaleIdsRef.current.add(dbWhale.id)
      }
    })

    spawnIndex += SPAWN_BATCH_SIZE
    if (spawnIndex >= whales.length) {
      clearInterval(interval)
    }
  }, SPAWN_INTERVAL_MS)

  return () => clearInterval(interval)
}, [whales, loading])
```

**효과**:
- 스폰 시간 분산: 1초 집중 → **2-3초 분산** (체감 부드러움)
- 첫 화면 표시: 즉시 (20마리부터 시작)

---

### 방안 3: 공간 분할 (Spatial Partitioning) (우선순위: 🟢 낮음)

**현재**: O(n²) 충돌 검사
**개선**: Quadtree/Grid로 O(n log n)

**복잡도**: 높음 (코드 대폭 수정 필요)
**효과**: 100마리 기준 10,000 → **500-1,000 계산** (90% 감소)

**권장**: 방안 1, 2로도 충분하므로 현재는 보류

---

### 방안 4: 비가시 고래 업데이트 스킵 (우선순위: 🟡 중간)

**현재**: 모든 고래 매 프레임 업데이트
**개선**: 화면 밖 고래는 물리 계산 스킵

**구현**:
```javascript
// WhaleManager.js의 update 함수 수정
visibleBuyWhales.forEach((whale) => {
  // 화면 안에 있는 고래만 체크
  const pos = whale.getPixelPosition(canvasWidth, canvasHeight)
  const onScreen = pos.x >= -100 && pos.x <= canvasWidth + 100 &&
                   pos.y >= -100 && pos.y <= canvasHeight + 100

  if (onScreen || whale.visible) {
    whale.update(visibleBuyWhales, canvasWidth, canvasHeight)
  }
})
```

**효과**:
- 화면 밖 고래 (30-50%): 물리 계산 스킵
- CPU 사용량: **30-50% 감소**

---

## 🚀 권장 적용 순서

### Phase 1: 즉시 적용 (30분)
1. **방안 1**: Supabase 쿼리 최적화
   - 가장 큰 효과 (2-4초 → 0.3-0.5초)
   - 코드 수정 최소 (useWhaleData.js 10줄)

### Phase 2: 단기 적용 (2시간)
2. **방안 2**: 점진적 스폰
   - 체감 성능 크게 개선
   - WhaleCanvas.jsx 수정 (~30줄)

3. **방안 4**: 비가시 고래 스킵
   - 지속적 성능 개선
   - WhaleManager.js 수정 (~20줄)

### Phase 3: 장기 검토 (추후)
4. **방안 3**: 공간 분할
   - 고래 수가 300+ 넘어갈 경우에만 필요
   - 현재는 불필요

---

## 📈 예상 개선 효과

| 단계 | 현재 | Phase 1 | Phase 2 | 목표 달성 |
|------|------|---------|---------|-----------|
| Supabase 쿼리 | 2-4초 | **0.3-0.5초** | 0.3-0.5초 | ✅ |
| 고래 스폰 | 0.5-1초 | 0.5-1초 | **0.1초** (체감) | ✅ |
| 물리 계산 | 2-3초 | **0.2-0.3초** | 0.2-0.3초 | ✅ |
| 이미지 로딩 | 0.1초 | 0.1초 | 0.1초 | ✅ |
| **총 로딩 시간** | **5-8초** | **1.1-1.9초** | **0.7-0.9초** | **✅ 목표 달성** |

---

## 🎯 결론

**주요 원인**:
1. 30일치 데이터를 한번에 가져오는 Supabase 쿼리 (2-4초)
2. 1,500마리 고래의 O(n²) 물리 계산 (2-3초)

**해결책**:
- **방안 1** (Supabase 쿼리 최적화) 만으로도 **70% 개선 가능**
- **방안 1 + 2** 적용 시 **목표 달성 (1-2초)**

**다음 단계**: 방안 1부터 적용 시작하시겠어요?

---

**작성자**: Claude Code
**검증**: 코드 분석 기반 (실제 프로파일링 권장)
