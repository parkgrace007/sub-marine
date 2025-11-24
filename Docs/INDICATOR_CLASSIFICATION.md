# SubMarine 지표 분류 시스템 (Indicator Classification System)

SubMarine 프로젝트의 4가지 핵심 기술적 지표 분류 체계입니다.

---

## 📊 개요 및 Quick Reference

SubMarine은 4가지 핵심 지표를 사용하여 암호화폐 시장을 분석합니다:

| 지표 | 분류 체계 | 범위/기준 | 주요 용도 |
|------|----------|----------|----------|
| **RSI** | 10단계 (Level 1-10) | 0-100 (10단위) | 과매수/과매도 감지 |
| **MACD** | 7단계 (Level 1-7) | Histogram 기준 | 모멘텀 추세 확인 |
| **Bollinger Bands** | Width 7단계 + Position 5단계 | 변동성 + 가격 위치 | 변동성 측정, 브레이크아웃 |
| **Whale** | 7단계 (Tier 1-7) + Flow 5단계 | $10M-$1B+ | 대형 자금 흐름 추적 |

### 핵심 특징

1. **RSI (Relative Strength Index)**
   - 10단계 정밀 분류 (극강 과매도 → 극강 과매수)
   - 과매수/과매도 구간 세분화
   - 다이버전스 패턴 감지

2. **MACD (Moving Average Convergence Divergence)**
   - 7단계 Histogram 분류 (극강 약세 → 극강 강세)
   - 골든크로스/데드크로스 신호
   - 모멘텀 방향 및 강도 측정

3. **Bollinger Bands**
   - BB Width 7단계 (극강 수축 → 극강 확장)
   - Price Position 5단계 (하단 돌파 → 상단 돌파)
   - Squeeze/Expansion 패턴 인식

4. **Whale (대형 거래)**
   - Tier 7단계 ($10M → $1B+)
   - Flow Type 5단계 (Buy/Sell/Exchange/Internal/DeFi)
   - Clustering/Divergence 패턴 감지

---

# 📈 1. RSI 10단계 분류 시스템

**RSI (Relative Strength Index)** - 상대강도지수

## 📊 RSI 10단계 분류표

| Level | RSI 범위 | 이름 | 색상 코드 | 상태 설명 |
|-------|----------|------|-----------|-----------|
| 10 | 90-100 | 극강 과매수 (Extreme Overbought) | #00FF00 (Bright Green) | 극단적 과매수. 시장 광기. |
| 9 | 80-90 | 매우 과매수 (Very Overbought) | #00CC00 (Green) | 강한 과매수. 조정 임박. |
| 8 | 70-80 | 과매수 (Overbought) | #66FF66 (Light Green) | 과매수 구간. 익절 고려. |
| 7 | 60-70 | 강세 (Bullish) | #00BFFF (Blue) | 건강한 상승 추세. |
| 6 | 50-60 | 중립 상단 (Neutral High) | #808080 (Gray) | 매수세 우위. 중립선 상단. |
| 5 | 40-50 | 중립 하단 (Neutral Low) | #808080 (Gray) | 매도세 우위. 중립선 하단. |
| 4 | 30-40 | 약세 (Bearish) | #FFA500 (Orange) | 하락 추세 지속. |
| 3 | 20-30 | 과매도 (Oversold) | #FF6666 (Light Red) | 과매도 구간. 매수 고려. |
| 2 | 10-20 | 매우 과매도 (Very Oversold) | #CC0000 (Red) | 강한 과매도. 반등 임박. |
| 1 | 0-10 | 극강 과매도 (Extreme Oversold) | #FF0000 (Bright Red) | 극단적 과매도. 시장 공포. |

## 🔍 RSI 단독 해석

### 극강 과매수 (Level 10)
- **RSI 범위**: 90-100
- **의미**: 극단적 과매수, 시장 광기 상태
- **발생 빈도**: 극히 드묾 (연 5-10회, 주요 랠리 말기)
- **평균 지속 시간**: 2-6시간 (장기간 유지 불가)
- **리스크 레벨**: ⚠️⚠️⚠️ 극도로 높음 (조정 확률 85%+)

**전략**:
- 🔻 **전량 익절 강력 추천** (100% 포지션 청산)
- ⚠️ 신규 매수 절대 금지 (FOMO 저항)
- ⚠️ 추세 반전 임박 경계
- 🔔 **C-001 Alert 발동 구간** (Level 8 → 10 급상승 시)

**리스크 관리**:
- 익절: 즉시 전량 (지체 시 -10~20% 손실 위험)
- 손익비: 1:0.2 (추가 상승 여력 제한적)
- 포지션: 신규 진입 금지, 기존 포지션 0%

**실패 케이스**:
- 강한 상승 모멘텀에서 RSI 90+ 유지 (3-5일)
- 이 경우에도 **분할 익절 필수** (과욕 금물)
- "이번엔 다르다" 심리 → 가장 위험

**심리적 요소**:
- 😤 극도의 탐욕, FOMO (Fear Of Missing Out)
- 😰 익절 후 추가 상승 시 후회감
- ✅ 냉정함 유지 - "10% 놓치는 것보다 30% 잃는 게 위험"

**시장 컨텍스트**:
- 강세장: RSI 90+ 도달 후 10-20% 조정
- 약세장: 거의 발생 안함 (발생 시 단기 반등)
- 횡보장: 극히 드묾

### 매우 과매수 (Level 9)
- **RSI 범위**: 80-90
- **의미**: 강한 과매수, 조정 가능성 높음
- **전략**:
  - 🔻 분할 익절 시작
  - ⚠️ 신규 매수 자제
  - ✅ 손절가 타이트하게 관리
  - ✅ MACD 데드크로스 감지 준비

### 과매수 (Level 8)
- **RSI 범위**: 70-80
- **의미**: 과매수 경고, 추세 지속 여부 관찰
- **전략**:
  - ✅ 부분 익절 고려
  - ⚠️ 추가 매수 신중
  - ✅ RSI 70 하향 돌파 시 익절 신호
  - ✅ BB 상단 돌파 여부 확인

### 강세 (Level 7)
- **RSI 범위**: 60-70
- **의미**: 건강한 상승 추세, 강세 확인
- **전략**:
  - ✅ 상승 추세 진입 타이밍
  - ✅ 추세 추종 전략 유효
  - ✅ 손절가 RSI 50 하단
  - ✅ MACD + BB 조합 확인

### 중립 상단 (Level 6)
- **RSI 범위**: 50-60
- **의미**: 매수세 우위, 중립선 지지
- **전략**:
  - ✅ 신규 매수 진입 가능
  - ✅ RSI 50 지지 확인
  - ⏸️ 방향성 불명확 시 관망
  - ✅ MACD 골든크로스 대기

### 중립 하단 (Level 5)
- **RSI 범위**: 40-50
- **의미**: 매도세 우위, 중립선 저항
- **전략**:
  - ⏸️ 신규 진입 보류
  - ⏸️ RSI 50 돌파 여부 관찰
  - 🔻 하향 돌파 시 매도 신호
  - ⏸️ MACD 교차 신호 대기

### 약세 (Level 4)
- **RSI 범위**: 30-40
- **의미**: 하락 추세 지속, 약세 확인
- **전략**:
  - 🔻 하락 추세 진입 타이밍
  - 🔻 추세 추종 매도 전략
  - 🔻 손절가 RSI 50 상단
  - ✅ MACD + BB 조합 확인

### 과매도 (Level 3)
- **RSI 범위**: 20-30
- **의미**: 과매도 경고, 반등 가능성
- **전략**:
  - ✅ 부분 매수 고려
  - ⚠️ 추가 매도 신중
  - ✅ RSI 30 상향 돌파 시 매수 신호
  - ✅ BB 하단 돌파 여부 확인

### 매우 과매도 (Level 2)
- **RSI 범위**: 10-20
- **의미**: 강한 과매도, 반등 임박
- **전략**:
  - ✅ 분할 매수 시작
  - ⚠️ 신규 매도 자제
  - ✅ 손절가 넓게 설정
  - ✅ MACD 골든크로스 감지 준비

### 극강 과매도 (Level 1)
- **RSI 범위**: 0-10
- **의미**: 극단적 과매도, 시장 공포 상태
- **전략**:
  - ✅ 적극적 매수 기회
  - ⚠️ 신규 매도 절대 금지
  - ⚠️ 추세 반전 임박 경계
  - 🔔 **C-001 Alert 발동 구간** (Level 3 → 1 급락 시)

## 🔄 RSI 다이버전스 (Divergence)

### 약세 다이버전스 (Bearish Divergence)
```
가격: 고점 상승 (Higher High)
RSI: 고점 하락 (Lower High)
→ 상승 추세 약화, 조정 임박
```

**발생 예시**:
- 가격: $50,000 → $52,000 → $54,000
- RSI: Level 8 (75) → Level 7.5 (72) → Level 7 (68)
- 결과: 매수 모멘텀 약화 → 조정 시작

**전략**:
- 🔻 익절 타이밍
- 🔻 매도 포지션 진입
- ⚠️ MACD 데드크로스 동반 시 신뢰도 ↑

### 강세 다이버전스 (Bullish Divergence)
```
가격: 저점 하락 (Lower Low)
RSI: 저점 상승 (Higher Low)
→ 하락 추세 약화, 반등 임박
```

**발생 예시**:
- 가격: $50,000 → $48,000 → $46,000
- RSI: Level 3 (25) → Level 3.5 (28) → Level 4 (32)
- 결과: 매도 모멘텀 약화 → 반등 시작

**전략**:
- ✅ 매수 타이밍
- ✅ 숏 포지션 청산
- ⚠️ MACD 골든크로스 동반 시 신뢰도 ↑

## 🎯 RSI 파라미터

SubMarine에서 사용하는 RSI 설정:
```javascript
{
  period: 14,     // 14-period RSI (표준)
  values: closes  // 종가 기준
}
```

**계산 공식**:
```
RS = Average Gain (14) / Average Loss (14)
RSI = 100 - (100 / (1 + RS))

- RSI = 100: 14일간 상승만 발생
- RSI = 0: 14일간 하락만 발생
- RSI = 50: 상승/하락 동일
```

**Level 계산 로직**:
```javascript
function getRSILevel(rsi) {
  if (rsi <= 10) return 1       // Extreme Oversold
  if (rsi <= 20) return 2       // Very Oversold
  if (rsi <= 30) return 3       // Oversold
  if (rsi <= 40) return 4       // Bearish
  if (rsi <= 50) return 5       // Neutral Low
  if (rsi <= 60) return 6       // Neutral High
  if (rsi <= 70) return 7       // Bullish
  if (rsi <= 80) return 8       // Overbought
  if (rsi <= 90) return 9       // Very Overbought
  return 10                      // Extreme Overbought
}
```

## 💡 RSI 활용 가이드

### 단독 사용 시
1. **RSI > 70 (Level 8-10)**: 과매수 구간 - 익절 고려
2. **RSI < 30 (Level 1-3)**: 과매도 구간 - 매수 고려
3. **RSI 50 돌파**: 중립선 돌파 - 추세 전환 신호
4. **RSI 다이버전스**: 추세 약화 - 반전 준비

### MACD 조합 시
1. **RSI L8-10 + MACD 데드크로스** → 강력한 매도 신호
2. **RSI L1-3 + MACD 골든크로스** → 강력한 매수 신호
3. **RSI L6-7 + MACD L5-7** → 상승 추세 확인
4. **RSI L4-5 + MACD L3-1** → 하락 추세 확인
5. **RSI/MACD 동시 다이버전스** → 추세 전환 확신

### BB 조합 시
1. **RSI > 80 + Price > BB_Upper** → 극단적 과매수 (익절)
2. **RSI < 20 + Price < BB_Lower** → 극단적 과매도 (매수)
3. **RSI 중립 + BB Squeeze** → 브레이크아웃 대기
4. **RSI L7-8 + BB Expansion** → 상승 트렌드 가속

### 주의사항
- RSI는 **후행 지표** - 추세 확인용
- 강한 트렌드에서는 **장기간 과열/과매도 유지** 가능
- 반드시 **다른 지표와 함께 사용** (MACD, BB 필수)
- RSI 50은 **동적 지지/저항선** 역할

## 📈 RSI 실전 예시

### 예시 1: RSI 과매수 익절
```
시나리오:
1. RSI 85 (Level 9) - 매우 과매수
2. MACD Histogram +42 (Level 6)
3. Price > BB_Upper (3일 지속)

→ MACD 데드크로스 발생 (Histogram +42 → +35)
→ RSI 83 → 78 → 72 (Level 9 → 8 → 7 하락)

전략: 분할 익절 시작 (1/3씩)
- RSI 80 하향 돌파: 1차 익절
- MACD 데드크로스: 2차 익절
- RSI 70 하향 돌파: 전량 익절
```

### 예시 2: RSI 과매도 매수
```
시나리오:
1. RSI 18 (Level 2) - 매우 과매도
2. MACD Histogram -38 (Level 2)
3. Price < BB_Lower (2일 지속)

→ MACD 골든크로스 발생 (Histogram -38 → -25)
→ RSI 18 → 24 → 32 (Level 2 → 3 → 4 상승)

전략: 분할 매수 시작 (1/3씩)
- RSI 20 상향 돌파: 1차 매수
- MACD 골든크로스: 2차 매수
- RSI 30 상향 돌파: 추가 매수
```

### 예시 3: RSI 다이버전스 경고
```
시나리오:
가격: $50,000 → $52,000 → $54,000 (Higher High)
RSI: Level 8 (78) → Level 7 (72) → Level 7 (65) (Lower High)
MACD: Histogram +48 → +42 → +35 (감소)

→ 약세 다이버전스 확인
→ RSI Level 8 → 7 하락
→ MACD 모멘텀 약화

전략: 전량 익절 (조정 임박)
Stop-Loss: Price가 $52,000 하향 돌파 시
Re-Entry: RSI 50 지지 확인 후
```

---

# 📉 2. MACD 7단계 분류 시스템

**MACD (Moving Average Convergence Divergence)** - 이동평균 수렴확산 지수

## 📊 MACD 7단계 분류표

| Level | Histogram 범위 | 이름 | 색상 코드 | 상태 설명 |
|-------|---------------|------|-----------|-----------|
| 7 | +50 이상 | 극 매수세 (Extreme Bullish) | #00FF00 (Bright Green) | 극단적 상승 모멘텀. 과열 경계. |
| 6 | +20 ~ +50 | 강한 매수세 (Very Bullish) | #00CC00 (Green) | 강력한 상승 추세. 매수세 우위. |
| 5 | +5 ~ +20 | 매수세 (Bullish) | #66FF66 (Light Green) | 상승 추세 지속. 매수 신호. |
| 4 | -5 ~ +5 | 중립 (Neutral) | #808080 (Gray) | 모멘텀 없음. 방향성 불명. |
| 3 | -20 ~ -5 | 매도세 (Bearish) | #FF6666 (Light Red) | 하락 추세 지속. 매도 신호. |
| 2 | -50 ~ -20 | 강한 매도세 (Very Bearish) | #CC0000 (Red) | 강력한 하락 추세. 매도세 우위. |
| 1 | -50 이하 | 극 매도세 (Extreme Bearish) | #FF0000 (Bright Red) | 극단적 하락 모멘텀. 과매도 경계. |

## 🔍 MACD 단독 해석

### 극강 강세 (Level 7)
- **Histogram**: +50 이상
- **의미**: 극단적 상승 모멘텀
- **전략**:
  - ✅ 단기 익절 고려
  - ⚠️ 추세 과열 경계
  - ⚠️ RSI 70+ 동반 시 조정 임박

### 강한 강세 (Level 6)
- **Histogram**: +20 ~ +50
- **의미**: 강력한 상승 추세 확인
- **전략**:
  - ✅ 추세 추종 매수
  - ✅ 손절가 상향 조정
  - ✅ 분할 익절 전략

### 강세 (Level 5)
- **Histogram**: +5 ~ +20
- **의미**: 상승 추세 초기/중기
- **전략**:
  - ✅ 신규 매수 진입
  - ✅ 골든크로스 후 추가 확인
  - ✅ 추세 지속 관찰

### 중립 (Level 4)
- **Histogram**: -5 ~ +5
- **의미**: 방향성 불명확, 횡보
- **전략**:
  - ⏸️ 관망 (신규 진입 보류)
  - ⏸️ 브레이크아웃 대기
  - ⏸️ 다른 지표 보조 필요

### 약세 (Level 3)
- **Histogram**: -20 ~ -5
- **의미**: 하락 추세 초기/중기
- **전략**:
  - 🔻 신규 매도 진입
  - 🔻 데드크로스 후 추가 확인
  - 🔻 추세 지속 관찰

### 강한 약세 (Level 2)
- **Histogram**: -50 ~ -20
- **의미**: 강력한 하락 추세 확인
- **전략**:
  - 🔻 추세 추종 매도
  - 🔻 손절가 하향 조정
  - 🔻 분할 손절 전략

### 극강 약세 (Level 1)
- **Histogram**: -50 이하
- **의미**: 극단적 하락 모멘텀
- **전략**:
  - 🔻 전량 손절 고려
  - ⚠️ 추세 과매도 경계
  - ⚠️ RSI 30- 동반 시 반등 임박

## 📈 MACD 교차 신호 (Cross Signals)

### 골든크로스 (Golden Cross)
```
MACD Line > Signal Line (Histogram > 0)
→ 매수 신호 (상승 모멘텀 시작)
```

**신뢰도 높은 경우**:
- MACD Line이 0선 위에서 교차 (강세장)
- RSI 50-60 구간 (과매수 아님)
- 거래량 증가 동반

**신뢰도 낮은 경우**:
- MACD Line이 0선 아래에서 교차 (약세장)
- RSI 70+ (과매수 구간)
- 거래량 감소

### 데드크로스 (Death Cross)
```
MACD Line < Signal Line (Histogram < 0)
→ 매도 신호 (하락 모멘텀 시작)
```

**신뢰도 높은 경우**:
- MACD Line이 0선 아래에서 교차 (약세장)
- RSI 40-50 구간 (과매도 아님)
- 거래량 증가 동반

**신뢰도 낮은 경우**:
- MACD Line이 0선 위에서 교차 (강세장)
- RSI 30- (과매도 구간)
- 거래량 감소

## 🔄 MACD 다이버전스 (Divergence)

### 약세 다이버전스 (Bearish Divergence)
```
가격: 고점 상승 (Higher High)
MACD: 고점 하락 (Lower High)
→ 상승 추세 약화, 조정 임박
```

**발생 조건**:
- 가격이 신고점 갱신
- MACD Histogram은 이전 고점 대비 감소
- 거래량 감소 동반

**전략**:
- 🔻 익절 타이밍
- 🔻 매도 포지션 진입
- ⚠️ 추세 전환 관찰

### 강세 다이버전스 (Bullish Divergence)
```
가격: 저점 하락 (Lower Low)
MACD: 저점 상승 (Higher Low)
→ 하락 추세 약화, 반등 임박
```

**발생 조건**:
- 가격이 신저점 갱신
- MACD Histogram은 이전 저점 대비 증가
- 거래량 감소 동반

**전략**:
- ✅ 매수 타이밍
- ✅ 숏 포지션 청산
- ⚠️ 추세 전환 관찰

## 🎯 MACD 파라미터

SubMarine에서 사용하는 MACD 설정:
```javascript
{
  fastPeriod: 12,    // 단기 EMA
  slowPeriod: 26,    // 장기 EMA
  signalPeriod: 9,   // Signal Line EMA
  SimpleMAOscillator: false,  // EMA 사용
  SimpleMASignal: false       // EMA 사용
}
```

**계산 공식**:
```
MACD Line = EMA(12) - EMA(26)
Signal Line = EMA(MACD Line, 9)
Histogram = MACD Line - Signal Line
```

## 💡 MACD 활용 가이드

### 단독 사용 시
- **Histogram > 0**: 상승 모멘텀 (매수 우위)
- **Histogram < 0**: 하락 모멘텀 (매도 우위)
- **Histogram 절대값 증가**: 추세 강화
- **Histogram 절대값 감소**: 추세 약화

### RSI 조합 시 (기본)
1. **강세 확인**: MACD L5-7 + RSI L7-8 → 강력한 매수 신호
2. **약세 확인**: MACD L1-3 + RSI L3-4 → 강력한 매도 신호
3. **다이버전스**: MACD/RSI 동시 다이버전스 → 추세 전환 확신

### 주의사항
- MACD는 **후행 지표** - 추세 확인용
- 횡보장에서는 **잦은 허위 신호** 발생
- 반드시 **다른 지표와 함께 사용**
- 0선 교차는 추세 전환의 **강력한 신호**

---

# 📊 3. Bollinger Bands 분류 시스템

**Bollinger Bands (BB)** - 볼린저 밴드

## 📊 BB Width 7단계 분류표

**BB Width % = (BB_Upper - BB_Lower) / BB_Middle × 100**

| Level | Width % 범위 | 이름 | 색상 코드 | 상태 설명 |
|-------|-------------|------|-----------|-----------|
| 7 | 8% 이상 | 극강 확장 (Extreme Expansion) | #FF0000 (Bright Red) | 극단적 변동성. 급격한 가격 움직임. |
| 6 | 6% ~ 8% | 강한 확장 (Strong Expansion) | #FF6666 (Light Red) | 높은 변동성. 트렌드 가속화. |
| 5 | 4% ~ 6% | 확장 (Expansion) | #FFA500 (Orange) | 변동성 증가. 트렌드 형성 중. |
| 4 | 2.5% ~ 4% | 정상 (Normal) | #808080 (Gray) | 정상 변동성. 안정적 추세. |
| 3 | 1.5% ~ 2.5% | 수축 (Contraction) | #66B2FF (Light Blue) | 변동성 감소. 횡보장. |
| 2 | 1% ~ 1.5% | 강한 수축 (Strong Squeeze) | #0080FF (Blue) | 낮은 변동성. 브레이크아웃 임박. |
| 1 | 1% 이하 | 극강 수축 (Extreme Squeeze) | #0000FF (Bright Blue) | 극단적 횡보. 대형 움직임 직전. |

## 📍 Price Position 5단계 분류표

**가격의 밴드 내 위치 기준**

| Level | 위치 | 이름 | 색상 코드 | 상태 설명 |
|-------|------|------|-----------|-----------|
| 5 | Price > BB_Upper | 상단 돌파 (Above Upper) | #00FF00 (Bright Green) | 과매수 구간. 상승 과열. |
| 4 | BB_Middle < Price < BB_Upper | 상단 영역 (Upper Zone) | #66FF66 (Light Green) | 강세 구간. 매수세 우세. |
| 3 | Price ≈ BB_Middle (±2%) | 중립 영역 (Middle Zone) | #808080 (Gray) | 중립 구간. 방향성 불명. |
| 2 | BB_Lower < Price < BB_Middle | 하단 영역 (Lower Zone) | #FF6666 (Light Red) | 약세 구간. 매도세 우세. |
| 1 | Price < BB_Lower | 하단 돌파 (Below Lower) | #FF0000 (Bright Red) | 과매도 구간. 하락 과열. |

## 🔍 BB Width 단독 해석

### 극강 확장 (Level 7)
- **Width %**: 8% 이상
- **의미**: 극단적 변동성, 패닉 매수/매도
- **전략**:
  - ⚠️ 과도한 변동성 - 진입 자제
  - ✅ 기존 포지션 익절 고려
  - ⚠️ 급격한 추세 반전 가능성

### 강한 확장 (Level 6)
- **Width %**: 6% ~ 8%
- **의미**: 높은 변동성, 강한 트렌드
- **전략**:
  - ✅ 트렌드 추종 전략 유효
  - ✅ 손절가 넓게 설정
  - ⚠️ 변동성 감소 시그널 감지

### 확장 (Level 5)
- **Width %**: 4% ~ 6%
- **의미**: 변동성 증가, 트렌드 형성
- **전략**:
  - ✅ 트렌드 진입 타이밍
  - ✅ 방향성 확인 후 진입
  - ✅ 분할 매수/매도

### 정상 (Level 4)
- **Width %**: 2.5% ~ 4%
- **의미**: 정상 변동성, 안정적 추세
- **전략**:
  - ✅ 일반적 트레이딩 환경
  - ✅ 모든 전략 적용 가능
  - ✅ 리스크 관리 표준 적용

### 수축 (Level 3)
- **Width %**: 1.5% ~ 2.5%
- **의미**: 변동성 감소, 횡보장
- **전략**:
  - ⏸️ 신규 진입 보류
  - ⏸️ 브레이크아웃 준비
  - ⏸️ 타이트한 손절가 설정

### 강한 수축 (Level 2)
- **Width %**: 1% ~ 1.5%
- **의미**: Bollinger Squeeze, 대형 움직임 직전
- **전략**:
  - 🔔 **B-003 Alert 발동 구간**
  - ⏸️ 포지션 진입 대기
  - ✅ 브레이크아웃 방향 예측 (RSI/MACD 보조)
  - ✅ 손절/익절 미리 설정

### 극강 수축 (Level 1)
- **Width %**: 1% 이하
- **의미**: 극단적 횡보, 폭발적 움직임 임박
- **전략**:
  - 🔔 **Critical Alert - 대형 움직임 직전**
  - ✅ 양방향 진입 준비 (롱/숏 모두)
  - ✅ 첫 브레이크아웃 방향 즉시 추종
  - ⚠️ 가짜 돌파(Fake Breakout) 경계

## 📍 Price Position 단독 해석

### 상단 돌파 (Level 5)
- **위치**: Price > BB_Upper
- **의미**: 과매수 구간, 상승 모멘텀 강함
- **전략**:
  - ✅ 기존 롱 포지션 익절 고려
  - ⚠️ 신규 매수 자제 (고점 추격 위험)
  - ✅ BB 상단 따라 걷기 패턴 확인 (강세장)

### 상단 영역 (Level 4)
- **위치**: BB_Middle < Price < BB_Upper
- **의미**: 강세 구간, 매수세 우세
- **전략**:
  - ✅ 상승 추세 진입 타이밍
  - ✅ RSI/MACD 보조 확인
  - ✅ 손절가 BB_Middle 하단

### 중립 영역 (Level 3)
- **위치**: Price ≈ BB_Middle (±2%)
- **의미**: 중립 구간, 방향성 불명
- **전략**:
  - ⏸️ 관망 (신규 진입 보류)
  - ⏸️ 브레이크아웃 방향 대기
  - ⏸️ 다른 지표 우선 확인

### 하단 영역 (Level 2)
- **위치**: BB_Lower < Price < BB_Middle
- **의미**: 약세 구간, 매도세 우세
- **전략**:
  - 🔻 하락 추세 진입 타이밍
  - 🔻 RSI/MACD 보조 확인
  - 🔻 손절가 BB_Middle 상단

### 하단 돌파 (Level 1)
- **위치**: Price < BB_Lower
- **의미**: 과매도 구간, 하락 모멘텀 강함
- **전략**:
  - 🔻 기존 숏 포지션 익절 고려
  - ⚠️ 신규 매도 자제 (저점 추격 위험)
  - ✅ BB 하단 따라 걷기 패턴 확인 (약세장)

## 📊 BB 패턴 인식

### 1. Bollinger Squeeze (볼린저 스퀴즈)
```
조건: BB Width < 2% (Level 1-2)
의미: 변동성 극도로 낮음 → 대형 움직임 직전
전략: 브레이크아웃 방향 즉시 추종
```

**신뢰도 높은 경우**:
- Squeeze 지속 기간 3일 이상
- RSI 중립 구간 (40-60)
- 거래량 감소 동반

**B-003 Alert 조건**:
```javascript
if (currentWidth < priceRange) { // priceRange = bb_middle * 0.02
  return {
    tier: 'B',
    code: 'B-003',
    message: 'BB Squeeze - 브레이크아웃 임박'
  }
}
```

### 2. Bollinger Expansion (볼린저 확장)
```
조건: BB Width > 6% (Level 6-7)
의미: 변동성 급증 → 강한 트렌드
전략: 트렌드 추종 (단, 과열 경계)
```

**발생 조건**:
- Width가 이전 평균 대비 2배 이상
- 가격 급등/급락 동반
- 거래량 급증

**전략**:
- ✅ 초기 확장: 트렌드 진입
- ⚠️ 후기 확장: 익절 타이밍

### 3. BB Walking (밴드 따라 걷기)
```
상단 Walking: 가격이 BB_Upper를 따라 지속적으로 상승
하단 Walking: 가격이 BB_Lower를 따라 지속적으로 하락
의미: 강력한 트렌드 지속
```

**상단 Walking (강세)**:
- Price가 BB_Upper 근처 유지 (3일 이상)
- BB Width >= 3% (정상 변동성)
- RSI 70+ (과매수 구간에서도 지속)

**하단 Walking (약세)**:
- Price가 BB_Lower 근처 유지 (3일 이상)
- BB Width >= 3% (정상 변동성)
- RSI 30- (과매도 구간에서도 지속)

**전략**:
- ✅ Walking 초기: 트렌드 진입
- ⚠️ Walking 후기: 손절가 타이트하게 관리
- 🔔 Walking 종료 시그널: 가격이 BB_Middle로 복귀

### 4. Double Bollinger Breakout (더블 돌파)
```
조건: Price가 BB를 돌파 후 다시 밴드 내로 복귀
의미: 가짜 돌파 (Fake Breakout)
```

**가짜 돌파 특징**:
- 거래량 증가 없음
- 돌파 후 즉시 밴드 내 복귀 (1-2시간)
- RSI/MACD 확인 신호 없음

**대응 전략**:
- ⚠️ 첫 돌파에서 즉시 진입 자제
- ✅ 밴드 밖에서 2-3시간 유지 확인
- ✅ 거래량 + 지표 확인 후 진입

## 🎯 BB 파라미터

SubMarine에서 사용하는 BB 설정:
```javascript
{
  period: 20,      // 20-period SMA
  stdDev: 2,       // 표준편차 2배
  values: closes   // 종가 기준
}
```

**계산 공식**:
```
BB_Middle = SMA(20)
BB_Upper = SMA(20) + (2 × StdDev)
BB_Lower = SMA(20) - (2 × StdDev)
BB_Width = BB_Upper - BB_Lower
BB_Width% = (BB_Width / BB_Middle) × 100
```

**Position 계산**:
```javascript
// 가격이 밴드 내 어디에 위치하는지 계산
const position = (price - bb_lower) / (bb_upper - bb_lower) * 100
// 0% = BB_Lower, 50% = BB_Middle, 100% = BB_Upper
```

## 💡 BB 활용 가이드

### 단독 사용 시
1. **Squeeze (Width < 2%)**: 브레이크아웃 대기
2. **Expansion (Width > 6%)**: 트렌드 추종
3. **Price > BB_Upper**: 익절 타이밍
4. **Price < BB_Lower**: 반등 대기

### RSI 조합 시
1. **BB Squeeze + RSI 중립 (40-60)** → 브레이크아웃 신뢰도 ↑
2. **Price > BB_Upper + RSI > 80** → 과매수 경고 (익절)
3. **Price < BB_Lower + RSI < 20** → 과매도 경고 (반등 대기)
4. **BB Walking + RSI 극단값** → 강한 트렌드 확인

### MACD 조합 시
1. **BB Squeeze + MACD Golden Cross** → 상승 브레이크아웃
2. **BB Squeeze + MACD Death Cross** → 하락 브레이크아웃
3. **BB Expansion + MACD Histogram ↑** → 트렌드 가속
4. **BB Contraction + MACD Neutral** → 횡보장 확인

### 주의사항
- BB는 **변동성 지표** - 추세 방향 판단 불가
- Squeeze 후 **방향 예측 어려움** - RSI/MACD 필수
- **가짜 돌파 빈번** - 거래량 확인 필수
- BB_Middle은 **동적 지지/저항선** 역할

## 📈 BB 실전 예시

### 예시 1: Squeeze → 상승 Breakout
```
시나리오:
1. BB Width 1.2% (Level 2) - 3일 지속
2. RSI 55 (중립)
3. MACD Histogram +2 (약한 강세)

→ Golden Cross 발생 (MACD)
→ Price가 BB_Upper 돌파
→ 거래량 2배 증가

전략: 즉시 롱 진입
손절: BB_Middle
익절: BB_Upper + (BB_Width × 0.5)
```

### 예시 2: Upper Walking → 익절
```
시나리오:
1. Price가 BB_Upper 근처 유지 (5일)
2. RSI 82 (극단적 과매수)
3. MACD Histogram +45 (Level 6)
4. BB Width 5.5% (Level 5)

→ Price가 BB_Middle로 복귀 시작
→ MACD Histogram 감소

전략: 전량 익절
재진입: BB_Middle 지지 확인 후
```

### 예시 3: Fake Breakout
```
시나리오:
1. BB Squeeze 1.5% (Level 2)
2. Price가 BB_Upper 돌파
3. 거래량 증가 없음
4. RSI 68 (중립~강세)
5. 1시간 후 Price가 밴드 내 복귀

전략: 진입 보류 (가짜 돌파)
재평가: 다시 돌파 시도 시 거래량 확인
```

---

# 🐋 4. Whale 7단계 티어 시스템

**Whale (고래)** - 대형 거래 추적

## 📊 Whale Tier 7단계 분류표

**SubMarine 커스텀 시스템 (2025-11-19 업데이트)**

| Tier | 금액 범위 (USD) | Canvas 크기 | 이름 | 시각/사운드 자산 |
|------|----------------|-------------|------|------------------|
| 7 | $1B+ | 58-60px | 레전더리 고래 (Legendary) | tier7.png, T7_sound.mp3 |
| 6 | $500M - $1B | 52-58px | 울트라 고래 (Ultra) | tier6.png, T6_sound.mp3 |
| 5 | $200M - $500M | 45-52px | 메가 고래 (Mega) | tier5.png, T5_sound.mp3 |
| 4 | $100M - $200M | 35-45px | 대형 고래 (Large) | tier4.png, T4_sound.mp3 |
| 3 | $50M - $100M | 25-35px | 중형 고래 (Medium) | tier3.png, T3_sound.mp3 |
| 2 | $20M - $50M | 15-25px | 중소형 고래 (Small-Medium) | tier2.png, T2_sound.mp3 |
| 1 | $10M - $20M | 8-15px | 소형 고래 (Small) | tier1.png, T1_sound.mp3 |

> **참고**: SubMarine만의 커스텀 분류 시스템입니다. 깔끔한 금액 단위($10M/$20M/$50M/$100M/$200M/$500M/$1B)로 직관적인 이해를 제공합니다.

## 🐋 Flow Type 5단계 분류

Whale 거래의 방향성을 5가지로 분류:

| Flow Type | From → To | 의미 | 시장 영향 | 색상 |
|-----------|-----------|------|-----------|------|
| **Buy** | Exchange → Wallet | 매수 (거래소에서 출금) | 🟢 상승 압력 | Green |
| **Sell** | Wallet → Exchange | 매도 (거래소로 입금) | 🔴 하락 압력 | Red |
| **Exchange** | Exchange ↔ Exchange | 거래소 간 이동 | ⚪ 중립 (유동성) | Gray |
| **Internal** | Wallet ↔ Wallet | 지갑 간 이동 | ⚪ 중립 (재분배) | Gray |
| **DeFi** | Contract 관련 | 스마트 컨트랙트 | 🟡 DeFi 활동 | Yellow |

### Flow Type 판단 로직
```javascript
// backend/src/services/whaleAlert.js
function classifyFlowType(from_owner_type, to_owner_type) {
  if (from_owner_type === 'exchange' && to_owner_type !== 'exchange') {
    return 'buy'  // 거래소 → 지갑 (매수)
  }
  if (from_owner_type !== 'exchange' && to_owner_type === 'exchange') {
    return 'sell'  // 지갑 → 거래소 (매도)
  }
  if (from_owner_type === 'exchange' && to_owner_type === 'exchange') {
    return 'exchange'  // 거래소 간 이동
  }
  if (from_owner_type === 'contract' || to_owner_type === 'contract') {
    return 'defi'  // 컨트랙트 관련
  }
  return 'internal'  // 지갑 간 이동
}
```

## 🔍 Tier 단독 해석

### Tier 7: 레전더리 고래 ($1B+)
- **금액 범위**: $1,000,000,000 이상
- **크기**: 58-60px (최대)
- **의미**: 초대형 기관/고래의 움직임, 시장 주도 세력
- **발생 빈도**: 극히 드묾 (월 1-2회)
- **전략**:
  - 🔔 **즉시 알림 필수** (S-tier 수준)
  - ✅ Flow Type 우선 확인 (Buy/Sell)
  - ⚠️ Buy일 경우: 강력한 상승 신호
  - ⚠️ Sell일 경우: 강력한 하락 신호
  - ✅ 다른 지표와 즉시 조합 분석

### Tier 6: 울트라 고래 ($500M - $1B)
- **금액 범위**: $500,000,000 - $1,000,000,000
- **크기**: 52-58px
- **의미**: 대형 기관의 포지션 조정
- **발생 빈도**: 드묾 (주 1-2회)
- **전략**:
  - 🔔 **높은 우선순위 알림**
  - ✅ Flow Type 확인
  - ✅ RSI/MACD와 조합 분석
  - ⚠️ 추세 전환 가능성 주시

### Tier 5: 메가 고래 ($200M - $500M)
- **금액 범위**: $200,000,000 - $500,000,000
- **크기**: 45-52px
- **의미**: 중대형 기관의 거래
- **발생 빈도**: 보통 (일 2-3회)
- **전략**:
  - ✅ 알림 확인
  - ✅ Flow Type + RSI 조합
  - ✅ 여러 건 연속 발생 시 추세 확인
  - ⏸️ 단독 거래는 관찰만

### Tier 4: 대형 고래 ($100M - $200M)
- **금액 범위**: $100,000,000 - $200,000,000
- **크기**: 35-45px
- **의미**: 중형 기관 또는 대형 고래
- **발생 빈도**: 보통 (일 5-10회)
- **전략**:
  - ✅ 모니터링 필요
  - ✅ Flow Type 확인
  - ⏸️ 여러 건 집중 시 의미 있음
  - ⏸️ 단독 거래는 참고 수준

### Tier 3: 중형 고래 ($50M - $100M)
- **금액 범위**: $50,000,000 - $100,000,000
- **크기**: 25-35px
- **의미**: 중소형 기관 또는 중형 고래
- **발생 빈도**: 높음 (일 10-20회)
- **전략**:
  - ⏸️ 참고 수준
  - ✅ 같은 방향 연속 발생 시 주목
  - ⏸️ 단독 거래는 무시 가능
  - ✅ 통계적 분석용 데이터

### Tier 2: 중소형 고래 ($20M - $50M)
- **금액 범위**: $20,000,000 - $50,000,000
- **크기**: 15-25px
- **의미**: 소형 기관 또는 개인 고래
- **발생 빈도**: 매우 높음 (일 20-50회)
- **전략**:
  - ⏸️ 배경 노이즈 수준
  - ✅ 대량 발생 시 시장 심리 반영
  - ⏸️ 개별 거래는 무시
  - ✅ 통계적 분석용

### Tier 1: 소형 고래 ($10M - $20M)
- **금액 범위**: $10,000,000 - $20,000,000
- **크기**: 8-15px (최소)
- **의미**: Whale Alert API 최소 기준
- **발생 빈도**: 매우 높음 (일 50-100회)
- **전략**:
  - ⏸️ 배경 노이즈
  - ✅ 대량 발생 시만 의미 있음
  - ⏸️ 개별 거래는 무시
  - ✅ 통계적 분석 전용

## 📊 Whale 패턴 인식

### 1. Whale Clustering (고래 집중)
```
조건: 같은 Flow Type 거래가 15분 내 3건 이상 (Tier 4+)
의미: 대형 세력의 조직적 움직임
신호: 강력한 추세 신호
```

**Buy Clustering 예시**:
- 13:00 - Tier 5 Buy ($250M)
- 13:05 - Tier 4 Buy ($120M)
- 13:12 - Tier 6 Buy ($600M)
→ 총 $970M 매수 → **강력한 상승 신호**

**Sell Clustering 예시**:
- 14:00 - Tier 5 Sell ($350M)
- 14:08 - Tier 4 Sell ($150M)
- 14:14 - Tier 5 Sell ($280M)
→ 총 $780M 매도 → **강력한 하락 신호**

**전략**:
- 🔔 **C-002 Alert 발동** (15분 내 $10M+ 집중)
- ✅ Flow Type 방향 추종
- ✅ RSI/MACD 확인 후 진입
- ⚠️ 역방향 Clustering 발생 시 관망

### 2. Whale Divergence (고래 다이버전스)
```
조건: Whale Flow와 가격 움직임 불일치
의미: 스마트 머니와 시장의 괴리
신호: 추세 전환 가능성
```

**약세 다이버전스**:
- 가격: $50,000 → $52,000 → $54,000 (상승)
- Whale Flow: Sell Clustering 지속
- RSI: Level 8-9 (과매수)
→ **고래는 팔고, 소액 투자자는 사는 중 → 조정 임박**

**강세 다이버전스**:
- 가격: $50,000 → $48,000 → $46,000 (하락)
- Whale Flow: Buy Clustering 지속
- RSI: Level 2-3 (과매도)
→ **고래는 사고, 소액 투자자는 파는 중 → 반등 임박**

**전략**:
- ✅ Whale Flow를 믿고 가격 역방향 포지션
- ⚠️ RSI/MACD 확인 필수
- ✅ 리스크 관리 철저 (손절가 타이트)

### 3. Whale Silence (고래 침묵)
```
조건: 6시간 이상 Tier 4+ 거래 없음
의미: 대형 세력의 관망
신호: 변동성 감소, 브레이크아웃 대기
```

**특징**:
- 거래량 감소
- BB Width 수축 (Level 1-2)
- 가격 횡보

**전략**:
- ⏸️ 신규 진입 보류
- ✅ Whale Silence 종료 시 방향 확인
- ✅ 첫 Tier 6+ 거래 방향 추종

### 4. Legendary Whale Alert (레전더리 알림)
```
조건: Tier 7 ($1B+) 거래 발생
의미: 시장 주도 세력의 움직임
신호: 강력한 추세 시작 또는 전환
```

**발생 시 행동**:
1. **즉시 Flow Type 확인**
   - Buy → 강력한 상승 준비
   - Sell → 강력한 하락 준비
2. **다른 지표 즉시 확인**
   - RSI Level
   - MACD Histogram
   - BB Position
3. **포지션 결정**
   - 모든 지표 일치 시: 즉시 진입
   - 지표 불일치 시: 관망 또는 소량 진입
4. **리스크 관리**
   - 손절가 설정 필수
   - 분할 진입 전략

## 🎯 Whale 필터링 및 파라미터

### Whale Alert API 기준
```javascript
{
  min_value: 10000000,        // $10M+ 거래만 수신
  blockchain: 'bitcoin,ethereum,ripple',
  transaction_count: 500,     // 최근 500건 저장
  refresh_interval: 300000    // 5분마다 업데이트
}
```

### Tier 계산 공식
```javascript
// frontend/src/physics/WhaleManager.js
// backend/src/services/whaleAlert.js (동일 로직)

function calculateWhaleTier(amountUSD) {
  // Custom tier assignment with round number boundaries
  if (amountUSD >= 1000000000) return 7      // $1B+
  if (amountUSD >= 500000000) return 6       // $500M-$1B
  if (amountUSD >= 200000000) return 5       // $200M-$500M
  if (amountUSD >= 100000000) return 4       // $100M-$200M
  if (amountUSD >= 50000000) return 3        // $50M-$100M
  if (amountUSD >= 20000000) return 2        // $20M-$50M
  return 1                                    // $10M-$20M
}

function calculateWhaleSize(amountUSD) {
  // Linear size interpolation for smooth visual scaling
  const normalized = (amountUSD - 10000000) / (1000000000 - 10000000)
  return 8 + normalized * (60 - 8)  // 8px ~ 60px
}
```

### 변경 이력 (2025-11-19)
**Before** (로그 스케일):
```
- Tier 1: $10.0M - $19.3M
- Tier 2: $19.3M - $37.3M
- ...
- Tier 7: $518.0M+
- 로그 스케일 기반 계산
```

**After** (커스텀 리니어 시스템):
```
- Tier 1: $10M - $20M (깔끔한 단위)
- Tier 2: $20M - $50M
- ...
- Tier 7: $1B+ (상한 없음)
- SubMarine만의 직관적 분류 체계
```

## 💡 Whale 활용 가이드

### Whale 단독 사용 시
1. **Tier 6-7 거래**: 즉시 확인 필수
2. **Tier 4-5 Clustering**: 추세 신호
3. **Tier 1-3 대량 발생**: 시장 심리 반영
4. **Flow Type Buy > Sell**: 상승 압력
5. **Flow Type Sell > Buy**: 하락 압력

### RSI 조합 시
1. **Tier 6+ Buy + RSI L1-3** → 강력한 바닥 신호
2. **Tier 6+ Sell + RSI L8-10** → 강력한 고점 신호
3. **Whale Divergence + RSI 극단값** → 추세 전환 확신
4. **Whale Clustering + RSI 중립** → 새로운 추세 시작

### MACD 조합 시
1. **Tier 6+ Buy + MACD 골든크로스** → 상승 추세 확인
2. **Tier 6+ Sell + MACD 데드크로스** → 하락 추세 확인
3. **Whale Clustering + MACD 다이버전스** → 추세 전환 경고
4. **Whale Silence + MACD 중립** → 브레이크아웃 대기

### BB 조합 시
1. **Tier 6+ Buy + BB Squeeze** → 상승 브레이크아웃
2. **Tier 6+ Sell + BB Squeeze** → 하락 브레이크아웃
3. **Whale Buy + Price < BB_Lower** → 강력한 매수 신호
4. **Whale Sell + Price > BB_Upper** → 강력한 매도 신호

### 주의사항
- Whale 거래는 **선행 지표** - 시장 움직임 예측 가능
- Tier 1-3 단독 거래는 **노이즈** - 무시 가능
- **Flow Type이 핵심** - Buy/Sell 구분 필수
- **Clustering과 Divergence가 가장 신뢰도 높음**
- Exchange/Internal 거래는 **중립** - 시장 영향 적음

## 📈 Whale 실전 예시

### 예시 1: Tier 7 Buy Signal
```
시나리오:
1. 15:30 - Tier 7 Buy ($1.2B) 발생
2. RSI 45 (Level 5 - 중립 하단)
3. MACD Histogram -8 (Level 3 - 약세)
4. BB Width 2.1% (Level 3 - 수축)
5. Price = $48,500 (BB_Lower 근처)

분석:
- Tier 7 Buy = 초대형 매수
- RSI 중립, MACD 약세 → 바닥 형성
- BB Squeeze → 브레이크아웃 직전
- Price가 BB_Lower → 과매도 구간

전략: 즉시 롱 진입
진입가: $48,500
손절가: $47,000 (BB_Lower 이탈)
익절가: $52,000 (BB_Upper)
```

### 예시 2: Whale Clustering Sell
```
시나리오:
09:00 - Tier 5 Sell ($350M)
09:08 - Tier 4 Sell ($150M)
09:13 - Tier 6 Sell ($700M)
→ 총 $1.2B 매도 (15분 내)

현재 상황:
- RSI 78 (Level 8 - 과매수)
- MACD Histogram +42 (Level 6 - 강한 강세)
- BB Width 6.5% (Level 6 - 강한 확장)
- Price > BB_Upper (3일 지속)

분석:
- Whale Clustering Sell = 고래 탈출
- RSI 과매수, MACD 강세 → 과열
- BB 강한 확장 → 조정 임박
- Price가 BB_Upper 돌파 → 극단적 과매수

전략: 전량 익절 + 숏 진입
익절: 기존 롱 포지션 전량 청산
숏 진입가: $54,200
손절가: $55,500 (신고점 갱신 시)
익절가: $51,000 (BB_Middle)
```

### 예시 3: Whale Divergence
```
시나리오:
가격 움직임:
- Day 1: $50,000 (RSI 55)
- Day 2: $48,000 (RSI 42) - 하락
- Day 3: $46,000 (RSI 35) - 하락

Whale Flow (3일간):
- Day 1: Tier 5 Buy $300M + Tier 4 Buy $120M
- Day 2: Tier 6 Buy $650M + Tier 4 Buy $180M
- Day 3: Tier 5 Buy $400M + Tier 5 Buy $280M
→ 총 $1.93B 매수 (가격 하락 중 지속 매수)

MACD:
- Histogram -15 → -8 → -3 (약세 약화)

분석:
- 가격 하락 vs Whale Buy Clustering = **강세 다이버전스**
- RSI 과매도 진입
- MACD 약세 약화 (골든크로스 임박)
- 스마트 머니는 바닥에서 매수 중

전략: 적극적 매수
진입가: $46,000
손절가: $44,500 (Whale Buy 멈추면 손절)
익절가: $52,000 (RSI 70 도달 시)
```

---


# 📌 코드 구현 위치 총정리

## Frontend 구현

### RSI 관련
```javascript
// AlertTerminal.jsx (Line 65-119)
const getRSIStatus = () => {
  const rsi = sentiment.rsi_average
  // 10-level classification logic
  if (rsi <= 10) return { level: 1, status: 'EXTREME OVERSOLD' }
  // ... full implementation
}

// IndicatorStatusPanel.jsx (Line 15-26)
const getRSIStatus = (rsi) => {
  if (rsi <= 10) return { text: 'Extreme Oversold (L1)', color: 'text-red-400' }
  // ... full 10-level implementation
}

// MainVisualizationSet.jsx (Line 218-224)
// RSI color coding for graph

// DevDrawer.jsx (Line 131-143)
const getRSILevel = (rsi) => {
  // Full 10-level calculation
}

// useMarketData.js (Line 116)
const rsiResults = RSI.calculate({ values: closes, period: 14 })
```

### MACD 관련
```javascript
// AlertTerminal.jsx
const getMACDStatus = () => {
  // Currently 3-level (Bullish/Neutral/Bearish)
  // TODO: Upgrade to 7-level system
}

// IndicatorStatusPanel.jsx (Line 29-32)
const getMACDTrend = (histogram) => {
  // Currently 3-level
  // TODO: Upgrade to 7-level system
}

// useMarketData.js (Line 122-129)
const macdResults = MACD.calculate({
  values: closes,
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
  SimpleMAOscillator: false,
  SimpleMASignal: false
})
```

### BB 관련
```javascript
// AlertTerminal.jsx (Line 131-142)
const getBBStatus = () => {
  // BB Width display
}

// IndicatorStatusPanel.jsx (Line 36-45)
const getBBPosition = (price, bb_upper, bb_middle, bb_lower) => {
  // 3-level position (Near Upper/Middle/Lower)
  // TODO: Upgrade to 5-level system
}

// useMarketData.js (Line 117-121)
const bbResults = BollingerBands.calculate({
  values: closes,
  period: 20,
  stdDev: 2
})

// Line 165
const bb_width = latest.bb.upper - latest.bb.lower
```

### Whale 관련
```javascript
// WhaleManager.js (Line 45-67)
calculateWhaleSize(amountUSD) {
  // Custom tier assignment (7-tier system)
  if (amountUSD >= 1000000000) tier = 7
  // ... full tier logic

  // Linear size interpolation
  const normalized = (amountUSD - 10000000) / (1000000000 - 10000000)
  const size = 8 + normalized * (60 - 8)
}

// WhaleTooltip.jsx
// Whale information display (Tier, Amount, Flow Type)

// TransactionFeed.jsx (Line 78-156)
// Whale transaction feed with tier badges
```

## Backend 구현

### RSI 관련
```javascript
// alertSystem.js (Line 313-330)
async checkC001_RSILevelChange(marketData) {
  const currentLevel = this.getRSILevel(data1h.rsi_average)
  const prevLevel = this.prevRSILevel || currentLevel

  // 2단계 이상 변화 감지
  if (Math.abs(currentLevel - prevLevel) >= 2) {
    return {
      tier: 'C',
      code: 'C-001',
      message: `RSI Level Change - L${prevLevel} → L${currentLevel}`
    }
  }
}

getRSILevel(rsi) {
  // 10-level calculation (backend version)
}
```

### MACD 관련
```javascript
// alertSystem.js (Line 343-365)
async checkC003_MACDCross(marketData) {
  // Golden Cross / Death Cross detection
  const currentHistogram = data1h.macd_histogram
  const prevHistogram = this.prevMACDHistogram || 0

  if (prevHistogram <= 0 && currentHistogram > 0) {
    return { code: 'C-003', message: 'MACD Golden Cross' }
  }
  if (prevHistogram >= 0 && currentHistogram < 0) {
    return { code: 'C-003', message: 'MACD Death Cross' }
  }
}
```

### BB 관련
```javascript
// alertSystem.js (Line 372-396)
async checkB003_BBSqueeze(marketData) {
  const data1h = marketData['1h']
  const currentWidth = data1h.bb_upper - data1h.bb_lower
  const priceRange = data1h.bb_middle * 0.02 // 2% threshold

  if (currentWidth < priceRange) {
    return {
      tier: 'B',
      code: 'B-003',
      message: 'BB Squeeze - 브레이크아웃 임박',
      bb_width: currentWidth
    }
  }
}

// Line 576-602
async getHistoricalBBWidth(timeframe, periods) {
  // Query historical BB width from database
}

// Line 549-562
checkBBWalking(data) {
  // Check if price is walking along BB bands
}
```

### Whale 관련
```javascript
// whaleAlert.js (Line 89-145)
async function processWhaleTransaction(transaction) {
  const amountUSD = transaction.amount_usd
  const tier = calculateWhaleTier(amountUSD)
  const flowType = classifyFlowType(
    transaction.from.owner_type,
    transaction.to.owner_type
  )

  // Save to database
  await supabase.from('whale_events').insert({
    // ... transaction data
    flow_type: flowType,
    tier: tier
  })
}

// alertSystem.js (Line 331-350)
async checkC002_WhaleAlert(marketData) {
  // Whale Clustering detection
  const significantWhales = whaleData.filter(w => w.amount_usd >= 10000000)

  if (significantWhales.length >= 3) {
    return {
      tier: 'C',
      code: 'C-002',
      message: `Whale Clustering - ${significantWhales.length}건 감지`
    }
  }
}
```

## 계산 공식 코드

### RSI
```javascript
// technicalindicators library
import { RSI } from 'technicalindicators'

RSI.calculate({
  values: [close prices],
  period: 14
})

// Manual calculation
RS = Average Gain (14) / Average Loss (14)
RSI = 100 - (100 / (1 + RS))
```

### MACD
```javascript
// technicalindicators library
import { MACD } from 'technicalindicators'

MACD.calculate({
  values: [close prices],
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
  SimpleMAOscillator: false,
  SimpleMASignal: false
})

// Returns: { MACD, signal, histogram }
// MACD Line = EMA(12) - EMA(26)
// Signal Line = EMA(MACD Line, 9)
// Histogram = MACD Line - Signal Line
```

### Bollinger Bands
```javascript
// technicalindicators library
import { BollingerBands } from 'technicalindicators'

BollingerBands.calculate({
  values: [close prices],
  period: 20,
  stdDev: 2
})

// Returns: { middle, upper, lower }
// BB_Middle = SMA(20)
// BB_Upper = SMA(20) + (2 × StdDev)
// BB_Lower = SMA(20) - (2 × StdDev)
// BB_Width = BB_Upper - BB_Lower
```

### Whale Tier
```javascript
function calculateWhaleTier(amountUSD) {
  if (amountUSD >= 1000000000) return 7      // $1B+
  if (amountUSD >= 500000000) return 6       // $500M-$1B
  if (amountUSD >= 200000000) return 5       // $200M-$500M
  if (amountUSD >= 100000000) return 4       // $100M-$200M
  if (amountUSD >= 50000000) return 3        // $50M-$100M
  if (amountUSD >= 20000000) return 2        // $20M-$50M
  return 1                                    // $10M-$20M
}

function classifyFlowType(from_owner, to_owner) {
  if (from_owner === 'exchange' && to_owner !== 'exchange') return 'buy'
  if (from_owner !== 'exchange' && to_owner === 'exchange') return 'sell'
  if (from_owner === 'exchange' && to_owner === 'exchange') return 'exchange'
  if (from_owner === 'contract' || to_owner === 'contract') return 'defi'
  return 'internal'
}
```

---

# 🔗 관련 문서

- **ALERT_System.md**: [ALERT_System.md](../ALERT_System.md) - Alert 신호 시스템
- **CLAUDE.md**: [CLAUDE.md](../CLAUDE.md) - SubMarine 개발 가이드
- **PRD.md**: [Docs/PRD.md](PRD.md) - 프로젝트 요구사항 문서
- **Whale Alert API**: [Docs/WHALE_ALERT_API.md](WHALE_ALERT_API.md) - Whale Alert API 가이드

---

**작성일**: 2025-11-20
**버전**: 1.0
**작성자**: SubMarine Project
**문서 형식**: 4개 지표 통합 분류 시스템
