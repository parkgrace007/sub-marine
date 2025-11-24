# 🚨 SubMarine Alert System Documentation

**Last Updated**: 2025-11-22
**Status**: Production

---

## 📋 Overview

SubMarine uses a dual-layer alert system to detect critical market signals:

1. **Backend Database Signals** - Scheduled checks (every 1 minute) that analyze market data and store alerts in Supabase
2. **Frontend Combo Signals** - Real-time client-side pattern matching using live market data

Both systems use a **4-tier priority system**: S (Critical) > A (High) > B (Medium) > C (Info)

---

## 🎯 Alert Architecture

```
┌─────────────────────────────────────────────────┐
│          Backend (Node.js Scheduler)            │
│  Checks every 1 minute via node-cron            │
│  ├─ S-001: WHALE_SURGE (NEW 2025-11-22)         │
│  ├─ S-002: PERFECT_CONFLUENCE                   │
│  ├─ A-002: WHALE_MOMENTUM_SYNC                  │
│  ├─ B-002: WHALE_DISTRIBUTION                   │
│  ├─ B-003: VOLATILITY_SPIKE                     │
│  ├─ C-001: RSI_LEVEL_CHANGE                     │
│  ├─ C-002: WHALE_SPOTTED                        │
│  ├─ C-003: MACD_CROSS                           │
│  └─ C-006: SQUEEZE_START                        │
│                                                  │
│  Stores in: supabase.alerts table               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│       Frontend (React + Supabase Realtime)      │
│  Subscribes to alerts table + local detection   │
│  ├─ S-01: ABYSSAL SCOOP                         │
│  ├─ S-02: LEVIATHAN DUMP                        │
│  ├─ S-03: WHALE TORPEDO                         │
│  ├─ S-04: HULL CRACK                            │
│  ├─ A-01: SMART DIVERGENCE                      │
│  ├─ A-02: EXIT DIVERGENCE                       │
│  ├─ A-03: FULL THROTTLE                         │
│  ├─ B-01: BB SQUEEZE                            │
│  ├─ B-02: RSI OVERBOUGHT                        │
│  └─ B-03: MACD GOLDEN CROSS                     │
│                                                  │
│  Displays in: ImportantAlertCard + AlertTerminal│
└─────────────────────────────────────────────────┘
```

---

## 🔴 Backend Database Signals

### S-Tier (Critical) - Priority 1

#### **S-001: WHALE_SURGE** 🆕
**Added**: 2025-11-22
**Type**: Real-time whale surge detection
**Check Interval**: Every 1 minute

**Trigger Conditions**:
- **Time Window**: 10 minutes
- **Threshold**: 3+ whales with $100M+ each
- **Flow Types**: All (buy/sell/internal/exchange/defi)
- **Deduplication**: Per 10-minute window

**Data Returned**:
```javascript
{
  signal_type: 'S-001',
  tier: 'S',
  timeframe: '10m',
  message: '🚨 WHALE SURGE - 5 large whales (≥$100M) detected in 10 minutes!',
  conditions: {
    whale_count: 5,
    total_volume: 542000000,
    total_volume_formatted: '0.54B',
    time_window: '10분',
    top_whales: [
      { amount_formatted: '150.0M', flow_type: 'buy', symbol: 'BTC', blockchain: 'bitcoin' },
      { amount_formatted: '120.0M', flow_type: 'internal', symbol: 'ETH', blockchain: 'ethereum' },
      { amount_formatted: '110.0M', flow_type: 'sell', symbol: 'USDT', blockchain: 'ethereum' }
    ]
  }
}
```

**Use Case**: Detect sudden market-moving whale activity (e.g., exchange hacks, institutional movements, coordinated dumps)

**Sound**: `alert-critical` (maps to T7 whale sound)

**Display Priority**: Overrides all other alerts in ImportantAlertCard

---

#### **S-002: PERFECT_CONFLUENCE**
**Type**: Multi-timeframe bullish convergence
**Check Interval**: Every 1 minute

**Trigger Conditions**:
- RSI breakout on both 1h and 4h (>70)
- Tier 5+ whale ($200M+) activity
- Volume 3x average
- MACD positive (>0.5)
- BB Walking (price hugging upper band)

**Use Case**: Strongest possible bullish signal - all indicators aligned

---

### A-Tier (High) - Priority 2

#### **A-002: WHALE_MOMENTUM_SYNC**
**Type**: Whale activity synchronized with technical momentum
**Check Interval**: Every 1 minute

**Trigger Conditions**:
- Whale net flow between $20M-$40M (buy bias)
- MACD increasing (4h timeframe)
- RSI in uptrend zone (50-70)

**Use Case**: Smart money accumulation during healthy uptrend

---

### B-Tier (Medium) - Priority 3

#### **B-002: WHALE_DISTRIBUTION**
**Type**: Smart money distribution pattern
**Check Interval**: Every 1 minute

**Trigger Conditions**:
- 3+ whale sell transactions
- Total sell weight ≥$10M
- RSI overbought (>70)

**Use Case**: Early warning of potential top formation

---

#### **B-003: VOLATILITY_SPIKE**
**Type**: Bollinger Band width expansion
**Check Interval**: Every 1 minute

**Trigger Conditions**:
- BB width >1.5x historical average (3h lookback)
- Volume spike confirmed

**Use Case**: Breakout or breakdown imminent

---

### C-Tier (Info) - Priority 4

#### **C-001: RSI_LEVEL_CHANGE**
**Type**: RSI crosses significant thresholds
**Check Interval**: Every 1 minute

**Trigger Conditions**:
- RSI level change ≥2 levels (1-10 scale)

**Use Case**: Track RSI momentum shifts

---

#### **C-002: WHALE_SPOTTED**
**Type**: Individual whale detection
**Check Interval**: Every 1 minute

**Trigger Conditions**:
- Any whale ≥$10M detected

**Use Case**: General whale activity monitoring

---

#### **C-003: MACD_CROSS**
**Type**: MACD golden/death cross
**Check Interval**: Every 1 minute

**Trigger Conditions**:
- MACD line crosses signal line

**Use Case**: Trend reversal signal

---

#### **C-006: SQUEEZE_START**
**Type**: Bollinger Band squeeze initiation
**Check Interval**: Every 1 minute

**Trigger Conditions**:
- BB width <2% of middle band price

**Use Case**: Volatility compression - breakout setup

---

## 🟢 Frontend ALERT_COMBOS (Real-time)

Located in: `frontend/src/constants/SubMarine_AlertCombos.js`

### S-Tier (Priority 1)

#### **S-01: ABYSSAL SCOOP (심해 줍기)**
**Type**: LONG
**Description**: 극단적 공포(RSI L1) + 고래의 대량 매집 + 거래량 폭발

**Conditions**:
```javascript
d.rsi.level <= 2 &&                     // 극강 과매도
d.bb.position === 'LOWER_BREAK' &&      // 밴드 하단 돌파
d.whale.hasBuyFlow &&                   // 고래 매수
d.whale.maxTier >= 6 &&                 // Tier 6+ 고래
(d.volume.status === 'EXPLOSIVE' || d.volume.status === 'ACTIVE')
```

---

#### **S-02: LEVIATHAN DUMP (리바이어던 투하)**
**Type**: SHORT
**Description**: 광기(RSI L10)의 정점에서 고래가 물량을 떠넘기고 있습니다

**Conditions**:
```javascript
d.rsi.level >= 9 &&                     // 극강 과매수
d.bb.position === 'UPPER_BREAK' &&      // 밴드 상단 돌파
d.whale.hasSellFlow &&                  // 고래 매도
d.whale.maxTier >= 6 &&                 // Tier 6+ 고래
(d.volume.status === 'EXPLOSIVE' || d.volume.status === 'ACTIVE')
```

---

#### **S-03: WHALE TORPEDO (고래 어뢰 발사)**
**Type**: LONG
**Description**: 응축된 에너지(Squeeze)를 고래가 상방으로 터뜨렸습니다

**Conditions**:
```javascript
d.bb.widthLevel <= 2 &&                 // 극강 수축
d.macd.status === 'GOLDEN' &&           // 골든크로스
d.macd.level >= 5 &&                    // 강한 신호
d.whale.hasBuyFlow &&                   // 고래 매수
d.volume.status === 'EXPLOSIVE'         // 거래량 폭발
```

---

#### **S-04: HULL CRACK (선체 붕괴)**
**Type**: SHORT
**Description**: 주요 지지선 붕괴 + 고래 투매 + 거래량 실린 하락

**Conditions**:
```javascript
d.bb.widthLevel <= 2 &&                 // 수축 상태
d.macd.status === 'DEAD' &&             // 데드크로스
d.whale.hasSellFlow &&                  // 고래 매도
d.volume.status === 'EXPLOSIVE'         // 거래량 폭발
```

---

### A-Tier (Priority 2)

#### **A-01: SMART DIVERGENCE (스마트 다이버전스)**
**Type**: LONG
**Description**: 가격은 떨어지지만 고래는 조용히 매집 중 (시간 가중 분석)

**Conditions**:
```javascript
d.price_change_weighted < 0 &&          // 최근 6h 하락
d.whale.netFlow > 30000000 &&           // $30M+ 순매수
d.whale.buyTotal >= 50000000 &&         // $50M+ 매수
d.whale.sellTotal >= 20000000 &&        // $20M+ 매도 (통계 유의성)
d.whale.buyTotal / d.whale.sellTotal >= 1.5 && // 1.5배 매수 우위
d.whale.maxTier >= 5 &&                 // Tier 5+
d.rsi.level <= 4                        // 저점권
```

---

#### **A-02: EXIT DIVERGENCE (탈출 다이버전스)**
**Type**: SHORT
**Description**: 가격은 오르지만 고래는 조용히 탈출 중

**Conditions**: (A-01의 역방향)

---

#### **A-03: FULL THROTTLE (전속 전진)**
**Type**: LONG
**Description**: 모든 엔진 가동. 밴드 상단을 타고 오르는 강력한 상승장

**Conditions**:
```javascript
d.bb.position === 'UPPER_ZONE' &&       // 상단 밴드 유지
d.macd.level >= 6 &&                    // 강한 상승세
d.volume.status !== 'CALM'              // 거래량 받쳐줌
```

---

### B-Tier (Priority 3)

#### **B-01: BB SQUEEZE**
**Type**: HOLD
**Description**: 볼린저밴드 강수축 + 거래량 저하. 변동성 수축 구간

---

#### **B-02: RSI OVERBOUGHT**
**Type**: SHORT
**Description**: RSI 90+. 기술적 과매수 구간 진입

---

#### **B-03: MACD GOLDEN CROSS**
**Type**: LONG
**Description**: MACD 골든크로스 발생 + 거래량 증가

---

## 🔊 Sound System

**File**: `frontend/src/utils/SoundManager.js`

### Sound Aliases (2025-11-22)
```javascript
{
  'alert-critical': 7,  // S-tier alerts → T7 whale sound
  'alert-high': 5,      // A-tier alerts → T5 whale sound
  'alert-medium': 3     // B-tier alerts → T3 whale sound
}
```

### Usage
```javascript
import soundManager from '../utils/SoundManager'

// Play S-tier alert
soundManager.play('alert-critical')

// Play whale spawn sound
soundManager.play(7)  // Tier 7
```

---

## 📊 Database Schema

### `alerts` Table (Supabase)
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL,              -- 'S-001', 'C-002', etc.
  tier TEXT CHECK (tier IN ('S','A','B','C')),
  timeframe TEXT,                         -- '1h', '4h', '10m', etc.
  priority INTEGER,                       -- 1-4
  severity INTEGER,                       -- 1-4
  message TEXT NOT NULL,
  conditions JSONB,                       -- Signal-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_signal_type (signal_type),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_tier (tier)
);
```

---

## 🎨 UI Display

### ImportantAlertCard Priority System
```javascript
// Priority 1: S-001 WHALE_SURGE (overrides all)
if (whaleSurgeAlert) {
  return <S001Display />
}

// Priority 2: ALERT_COMBOS (S/A/B tier)
if (activeCombo) {
  return <ComboDisplay />
}

// Priority 3: Scanning state
return <ScanningState />
```

### AlertLogTerminal
- Displays all backend alerts in chronological order
- Real-time Supabase subscription
- Filters by tier: ALL / S / A / B / C
- Auto-scroll to latest

---

## 🧪 Testing S-001 WHALE_SURGE

### Manual Test (Backend)
```javascript
// Inject dummy whale events
const dummyWhales = [
  { id: '1', amount_usd: 150000000, flow_type: 'buy', symbol: 'BTC', timestamp: Math.floor(Date.now()/1000) },
  { id: '2', amount_usd: 120000000, flow_type: 'internal', symbol: 'ETH', timestamp: Math.floor(Date.now()/1000) },
  { id: '3', amount_usd: 110000000, flow_type: 'sell', symbol: 'USDT', timestamp: Math.floor(Date.now()/1000) }
]

// Backend should detect S-001 on next scheduler run (within 1 minute)
```

### Expected Behavior
1. Backend detects surge → stores in `alerts` table
2. Frontend Supabase subscription fires
3. ImportantAlertCard displays S-001 with red theme
4. `alert-critical` sound plays (T7 whale sound)
5. Alert persists for 10 minutes (then expires)

---

## 📝 Implementation Checklist (S-001)

- [x] Backend: `alertSystem.js` - checkS001_WhaleSurge() function
- [x] Backend: scheduler.js - runs every 1 minute (no changes needed)
- [x] Frontend: `ImportantAlertCard.jsx` - S-001 display + Supabase subscription
- [x] Frontend: `SoundManager.js` - 'alert-critical' sound alias
- [x] Documentation: `ALERT_SYSTEM.md` (this file)
- [ ] Testing: Manual trigger test
- [ ] Testing: Backend server restart

---

## 🔧 Maintenance

### Adding New Backend Signals

1. Create check function in `alertSystem.js`:
```javascript
async checkX001_NewSignal(marketData, whaleData) {
  const conditions = { /* your logic */ }

  if (/* trigger condition */) {
    return {
      signal_type: 'X-001',
      tier: 'X',  // S/A/B/C
      timeframe: '1h',
      priority: SIGNAL_PRIORITY['X'],
      severity: SIGNAL_SEVERITY['X'],
      message: 'Your alert message',
      conditions: conditions
    }
  }
  return null
}
```

2. Register in `checkAllSignals()`:
```javascript
const signals = await Promise.all([
  // ... existing checks
  this.checkX001_NewSignal(marketData, whaleData)
])
```

3. Update this documentation

### Adding New Frontend ALERT_COMBOS

1. Add to `SubMarine_AlertCombos.js`:
```javascript
{
  id: 'X-01',
  tier: 'X',
  priority: 1,  // 1-4
  type: 'LONG',  // LONG/SHORT/HOLD
  title: 'Signal Name',
  desc: 'Korean description',
  condition: (d) => (/* your logic */)
}
```

2. Update this documentation

---

**Last Updated**: 2025-11-22
**Maintainer**: SubMarine Development Team
