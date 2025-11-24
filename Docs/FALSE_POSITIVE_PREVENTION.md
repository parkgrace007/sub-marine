# 🛡️ SubMarine Alert System - False Positive Prevention

**Last Updated**: 2025-11-22
**Version**: 1.1
**Status**: Implemented (Phase 1-3 + B-01 Fix Complete)

---

## 📋 Executive Summary

This document details the 7 critical fixes implemented to prevent false trading signals in the SubMarine alert system. These fixes address temporal misalignment, statistical insignificance, flow type misclassification, and logic errors that could lead to user losses.

**Implementation Priority**: Option B (Immediate + High Priority) + B-01 Logic Fix
**Affected Alerts**: 11 out of 12 alert combos (92%)
**Impact**: Prevents liquidation scenarios from false signals and missed trading opportunities

---

## 🎯 Implementation Status

### ✅ Completed Fixes (Phase 1-3 + B-01 Fix)

| Phase | Fix | Affected Alerts | Status |
|-------|-----|----------------|---------|
| 1-1 | Flow Type Filtering | S-01, S-02, S-03, S-04, A-01, A-02 | ✅ Complete |
| 1-2 | Minimum Absolute Thresholds | A-01, A-02 | ✅ Complete |
| 2 | MACD Threshold Strengthening | S-03, B-03 | ✅ Complete |
| 3 | Time-Weighted Price Change | A-01, A-02 | ✅ Complete |
| **B-01** | **BB Squeeze Range Expansion** | **B-01** | **✅ Complete** |

### ⏳ Future Work (Phase 4+)

| Phase | Fix | Affected Alerts | Status |
|-------|-----|----------------|---------|
| 4 | Funding Rate Integration | S-02 | 📋 Planned (Backend) |
| 5 | Low Liquidity Detection | S-01, S-02 | 📋 Planned (Backend) |

---

## 🔧 Detailed Fix Documentation

### Phase 1-1: Flow Type Filtering

**Problem**: Exchange-to-exchange transfers being counted as market buy/sell signals

**Impact Before Fix**:
- Internal custody movements triggering false "whale buying" signals
- Exchange rebalancing operations causing false alerts
- DeFi protocol interactions counted as market activity

**Solution**:
Modified `alertComboTransformer.js` `getWhaleData()` function to only count genuine market flows:

```javascript
// CRITICAL FIX: Only count 'buy' and 'sell' flows
// Exclude 'exchange' (exchange-to-exchange transfers) and 'internal' (custody movements)
// These are NOT market buy/sell signals
if (whale.flow_type === 'buy') {
  weightedBuyTotal += weightedAmount
} else if (whale.flow_type === 'sell') {
  weightedSellTotal += weightedAmount
}
// Note: 'exchange', 'internal', 'defi' flows are intentionally ignored
// to prevent false signals from non-market movements
```

**File**: [alertComboTransformer.js:173-179](../frontend/src/utils/alertComboTransformer.js#L173-L179)

**Affected Alerts**:
- S-01: ABYSSAL SCOOP
- S-02: LEVIATHAN DUMP
- S-03: WHALE TORPEDO
- S-04: HULL CRACK
- A-01: SMART DIVERGENCE
- A-02: EXIT DIVERGENCE

---

### Phase 1-2: Minimum Absolute Thresholds

**Problem**: High buyTotal/sellTotal ratios from statistically insignificant sample sizes

**Impact Before Fix**:
- 2-3 transactions with $5M buy / $1M sell = 5x ratio → false divergence trigger
- Low volume periods generating misleading ratio signals
- Statistical noise overwhelming actual market trends

**Solution**:
Added minimum absolute thresholds to A-01 and A-02:

```javascript
// A-01: SMART DIVERGENCE
d.whale.buyTotal >= 50000000 &&         // 3. 매수 절대값: 최소 $50M (통계 유의성)
d.whale.sellTotal >= 20000000 &&        // 4. 매도 절대값: 최소 $20M
d.whale.buyTotal / d.whale.sellTotal >= 1.5 && // 5. 매수 우위도 1.5배 이상

// A-02: EXIT DIVERGENCE
d.whale.sellTotal >= 50000000 &&        // 3. 매도 절대값: 최소 $50M (통계 유의성)
d.whale.buyTotal >= 20000000 &&         // 4. 매수 절대값: 최소 $20M
d.whale.sellTotal / d.whale.buyTotal >= 1.5 && // 5. 매도 우위도 1.5배 이상
```

**File**: [SubMarine_AlertCombos.js:94-98, 112-116](../frontend/src/constants/SubMarine_AlertCombos.js#L94-L98)

**Rationale**:
- $50M threshold ensures statistical significance (multiple large transactions)
- $20M minimum for denominator prevents ratio manipulation
- 1.5x ratio ensures clear directional bias

**Affected Alerts**:
- A-01: SMART DIVERGENCE
- A-02: EXIT DIVERGENCE

---

### Phase 2: MACD Threshold Strengthening

**Problem**: Weak golden cross signals with minimal momentum

**Impact Before Fix**:
- MACD line barely crossing signal line → immediate alert
- Histogram at 0.01% (noise level) triggering S-tier alerts
- False breakout signals during ranging markets

**Solution**:
Added `macd.level >= 5` requirement (histogram >0.05%):

```javascript
// S-03: WHALE TORPEDO
d.macd.status === 'GOLDEN' &&           // 2. 모멘텀: 골든크로스 시작
d.macd.level >= 5 &&                    // 3. MACD 강도: histogram >0.05% (강한 신호)

// B-03: MACD 골든크로스
d.macd.status === 'GOLDEN' &&           // 골든크로스
d.macd.level >= 5 &&                    // MACD 강도: histogram >0.05% (약한 신호 필터)
```

**File**: [SubMarine_AlertCombos.js:61, 169](../frontend/src/constants/SubMarine_AlertCombos.js#L61)

**MACD Level Classification** (Reference: [alertComboTransformer.js:76-82](../frontend/src/utils/alertComboTransformer.js#L76-L82)):
- Level 7: histogram ≥ 0.5%
- Level 6: histogram ≥ 0.2%
- **Level 5: histogram ≥ 0.05%** ← Minimum threshold
- Level 4: histogram ≥ -0.05% (neutral)
- Level 3: histogram ≥ -0.2%
- Level 2: histogram ≥ -0.5%
- Level 1: histogram < -0.5%

**Affected Alerts**:
- S-03: WHALE TORPEDO
- B-03: MACD 골든크로스

---

### Phase 3: Time-Weighted Price Change

**Problem**: Temporal mismatch between price data (24h) and whale data (6h exponential weighting)

**Impact Before Fix**:
- Price dropping 24h ago, but rising last 6h → false "divergence" trigger
- Whale accumulation over 6h compared to irrelevant 24h price action
- Asynchronous data windows causing false correlation

**Solution**:
Created `calculateTimeWeightedPriceChange()` with matching 6-hour window:

```javascript
/**
 * Calculate time-weighted price change (matching whale data time window)
 * Uses same 6-hour window as whale time-weighting for temporal alignment
 * @param {object} sentiment - Market sentiment data with history
 * @param {number} timeWindowHours - Time window in hours (default: 6)
 * @returns {number|null} Price change percentage over time window, or null if insufficient data
 */
export const calculateTimeWeightedPriceChange = (sentiment, timeWindowHours = 6) => {
  const history = sentiment?.history
  if (!history || history.length === 0) return null

  const now = Date.now()
  const cutoff = now - (timeWindowHours * 60 * 60 * 1000)

  // Filter data within time window (history is sorted latest → oldest)
  const recentData = history.filter(d => d.time >= cutoff)

  if (recentData.length < 2) return null

  const latest = recentData[0]
  const oldest = recentData[recentData.length - 1]

  // Calculate simple price change over time window
  return ((latest.price - oldest.price) / oldest.price) * 100
}
```

**File**: [alertComboTransformer.js:102-119](../frontend/src/utils/alertComboTransformer.js#L102-L119)

**Integration**:
```javascript
// transformToComboData() now returns both price change metrics
return {
  // ... other fields
  price_change_24h: sentiment?.price_change_24h || 0,
  price_change_weighted: price_change_weighted !== null
    ? price_change_weighted
    : sentiment?.price_change_24h || 0
}
```

**Alert Condition Updates**:
```javascript
// A-01: SMART DIVERGENCE
d.price_change_weighted < 0 &&          // 1. 가격: 최근 6h 하락 중 (시간 동기화)

// A-02: EXIT DIVERGENCE
d.price_change_weighted > 0 &&          // 1. 가격: 최근 6h 상승 중 (시간 동기화)
```

**Whale Time-Weighting Reference** ([alertComboTransformer.js:158-165](../frontend/src/utils/alertComboTransformer.js#L158-L165)):
```javascript
// Exponential decay: 6-hour half-life
// 1h ago = 85%, 3h ago = 61%, 6h ago = 37%, 12h ago = 14%
const weight = Math.exp(-ageHours / 6)
```

**Affected Alerts**:
- A-01: SMART DIVERGENCE
- A-02: EXIT DIVERGENCE

---

### B-01 Fix: BB Squeeze Range Expansion

**Problem**: Exact equality check (`widthLevel === 1`) too strict, missing legitimate squeeze conditions

**Impact Before Fix**:
- Only detecting "Extreme Squeeze" (Level 1, BB width < 1.0%)
- Missing "Strong Squeeze" (Level 2, BB width 1.0-1.5%)
- Contradicts documentation stating Level 2 = "브레이크아웃 임박, B-003 Alert 발동 구간"
- False negatives: Classic squeeze setups at 1.2% width ignored

**Solution**:
Changed condition from exact match to range check:

```javascript
// Before (SubMarine_AlertCombos.js:135)
condition: (d) => (
  d.bb.widthLevel === 1 &&                // Only L1 (< 1.0%)
  d.volume.status === 'CALM'
)

// After (SubMarine_AlertCombos.js:145)
condition: (d) => (
  d.bb.widthLevel <= 2 &&                 // L1 + L2 (<1.5%)
  d.volume.status === 'CALM'
)
```

**File**: [SubMarine_AlertCombos.js:143-147](../frontend/src/constants/SubMarine_AlertCombos.js#L143-L147)

**BB Width Level Reference** ([alertComboTransformer.js:40-47](../frontend/src/utils/alertComboTransformer.js#L40-L47)):
- Level 1: width < 1.0% (Extreme Squeeze)
- Level 2: 1.0% ≤ width < 1.5% (Strong Squeeze) ← Now included
- Level 3: 1.5% ≤ width < 2.5% (Moderate)

**Rationale**:
- Aligns code with documentation (INDICATOR_CLASSIFICATION.md)
- Captures full spectrum of actionable squeeze conditions
- Matches industry practice (squeeze = significant contraction, not just extreme)
- Prevents missing legitimate pre-breakout setups

**Affected Alerts**:
- B-01: BB Squeeze 구간

---

## 🚨 Real-World Scenarios Prevented

### Scenario 1: Coinbase → Binance Transfer (Phase 1-1)
**Before Fix**:
- Coinbase transfers $100M BTC to Binance for rebalancing
- flow_type: 'exchange' counted as 'buy'
- S-01 "ABYSSAL SCOOP" triggers → users long
- Actual market: sideways

**After Fix**:
- 'exchange' flow type ignored
- No false signal

---

### Scenario 2: Thin Sample Size Divergence (Phase 1-2)
**Before Fix**:
- 3 whale transactions: $8M buy, $2M sell (4x ratio)
- A-01 "SMART DIVERGENCE" triggers
- Actual market: noise, not accumulation

**After Fix**:
- buyTotal ($8M) < $50M threshold
- sellTotal ($2M) < $20M threshold
- Alert blocked

---

### Scenario 3: Weak MACD Noise (Phase 2)
**Before Fix**:
- MACD histogram crosses from -0.01% to +0.01%
- S-03 "WHALE TORPEDO" triggers
- Actual market: ranging, no momentum

**After Fix**:
- macd.level = 4 (histogram 0.01% < 0.05%)
- macd.level >= 5 requirement not met
- Alert blocked

---

### Scenario 4: Temporal Mismatch (Phase 3)
**Before Fix**:
- 24h ago: price dropped -10%
- Last 6h: price rallied +5%
- Whales accumulated $60M in last 6h
- A-01 "SMART DIVERGENCE" triggers (price_change_24h = -10%, whales buying)
- Actual market: price already recovering, divergence is stale

**After Fix**:
- price_change_weighted (6h) = +5% (rising)
- Condition requires price_change_weighted < 0
- Alert correctly blocked (no divergence in synchronized window)

---

### Scenario 5: Missed Squeeze Opportunity (B-01 Fix)
**Before Fix**:
- BTC BB Width: 1.2% (widthLevel = 2, "Strong Squeeze")
- Volume: 0.7x average (CALM)
- Historical context: Narrowest width in 90 days
- B-01 "BB Squeeze 구간" does NOT trigger (widthLevel === 1 condition)
- Actual market: Classic squeeze setup before breakout

**After Fix**:
- BB Width 1.2% (widthLevel = 2)
- Condition changed to `widthLevel <= 2`
- B-01 correctly triggers → users prepared for breakout
- Alert description updated: "강수축 (L1-L2)"

**Impact**: Captures full spectrum of actionable squeeze conditions (L1: <1.0%, L2: 1.0-1.5%)

---

## 📊 Testing Checklist

### Phase 1-1: Flow Type Filtering
- [ ] Verify 'exchange' flows not counted in buyTotal/sellTotal
- [ ] Verify 'internal' flows not counted
- [ ] Verify 'defi' flows not counted
- [ ] Verify only 'buy' and 'sell' flows counted
- [ ] Test with mixed flow type dataset

### Phase 1-2: Minimum Absolute Thresholds
- [ ] A-01: Verify $49M buyTotal blocks alert
- [ ] A-01: Verify $51M buyTotal allows alert (if other conditions met)
- [ ] A-02: Verify $19M sellTotal blocks alert
- [ ] A-02: Verify $21M sellTotal allows alert (if other conditions met)

### Phase 2: MACD Threshold Strengthening
- [ ] S-03: Verify macd.level = 4 (0.04% histogram) blocks alert
- [ ] S-03: Verify macd.level = 5 (0.06% histogram) allows alert
- [ ] B-03: Same verification as S-03

### Phase 3: Time-Weighted Price Change
- [ ] Verify calculateTimeWeightedPriceChange() returns null for empty history
- [ ] Verify 6-hour window filtering (cutoff calculation)
- [ ] Verify price change calculation (latest - oldest) / oldest * 100
- [ ] A-01: Verify uses price_change_weighted instead of price_change_24h
- [ ] A-02: Verify uses price_change_weighted instead of price_change_24h
- [ ] Test temporal alignment: 24h down, 6h up → should NOT trigger A-01

### B-01 Fix: BB Squeeze Range Expansion
- [ ] B-01: Verify widthLevel = 1 (0.8% width) triggers alert
- [ ] B-01: Verify widthLevel = 2 (1.2% width) NOW triggers alert (was blocked before)
- [ ] B-01: Verify widthLevel = 3 (1.6% width) does NOT trigger alert
- [ ] B-01: Test edge case at 1.0% width (L1/L2 boundary)
- [ ] B-01: Test edge case at 1.5% width (L2/L3 boundary)
- [ ] Verify description updated: "(L1-L2)" instead of "(L1)"

---

## 🔮 Future Work (Phase 4+)

### Phase 4: Funding Rate Integration (Backend Required)

**Target**: S-02 LEVIATHAN DUMP short squeeze prevention

**Requirements**:
1. Add funding_rate field to market_sentiment table
2. Fetch funding rate from Binance API every 30s
3. Add condition to S-02:
   ```javascript
   d.funding_rate < 0.05 // Funding rate not extremely positive (no short squeeze)
   ```

**Rationale**: Prevents shorting into short squeeze (funding rate >0.1% = extreme long pressure)

---

### Phase 5: Low Liquidity Detection (Backend Required)

**Target**: S-01, S-02 flash wick prevention

**Requirements**:
1. Calculate bid-ask spread from order book data
2. Add liquidity_score field to market_sentiment table
3. Add condition to S-01, S-02:
   ```javascript
   d.liquidity_score >= 7 // High liquidity (no flash wick risk)
   ```

**Rationale**: Prevents signals from order book manipulation / low liquidity spikes

---

## 📁 Modified Files Reference

### Frontend
- [frontend/src/utils/alertComboTransformer.js](../frontend/src/utils/alertComboTransformer.js)
  - Lines 173-179: Flow type filtering
  - Lines 102-119: Time-weighted price change calculation
  - Line 209: Integration in transformToComboData()
  - Line 220: price_change_weighted return field

- [frontend/src/constants/SubMarine_AlertCombos.js](../frontend/src/constants/SubMarine_AlertCombos.js)
  - Lines 93-98: A-01 minimum thresholds + time weighting
  - Lines 110-116: A-02 minimum thresholds + time weighting
  - Line 61: S-03 MACD level >= 5
  - Line 160: B-03 MACD level >= 5
  - Lines 143-147: B-01 BB Squeeze range expansion (widthLevel <= 2)

---

## 🎓 Key Learnings

### 1. Time Synchronization is Critical
Comparing data from different time windows (24h price vs 6h whales) creates false correlations. Always align temporal windows when detecting divergence.

### 2. Flow Type Classification Matters
Not all large transactions are market buy/sell signals. Exchange rebalancing, custody movements, and DeFi protocol interactions must be filtered.

### 3. Statistical Significance Over Ratios
A 10x buy/sell ratio from $1M/$100K is noise. A 1.5x ratio from $60M/$40M is signal. Absolute thresholds prevent ratio manipulation.

### 4. MACD Crossovers Need Magnitude
A crossover at 0.01% histogram is noise. Require >0.05% magnitude to filter ranging market noise.

### 5. Exact Equality vs Range Checks
Using exact equality (`===`) for level-based indicators can miss valid signals. BB Squeeze at Level 2 (1.0-1.5%) is still actionable. Use range checks (`<=`) to capture full spectrum of meaningful conditions.

---

## 📞 Contact & Maintenance

**Maintainer**: SubMarine Development Team
**Last Audit**: 2025-11-22
**Next Review**: After Phase 4 implementation

For questions or improvements, refer to:
- [CLAUDE.md](../CLAUDE.md) - Project overview
- [PRD.md](PRD.md) - Product requirements
- [TASK.md](TASK.md) - Current task status
