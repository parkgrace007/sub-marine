/**
 * 🔱 SubMarine God-Tier Alert Logic
 * * [설계 철학]
 * 1. Price Action (RSI + BB): 가격의 위치와 과열 여부 판단
 * 2. Market Fuel (Volume): 신호의 진위 여부 판별 (거래량 없으면 무효)
 * 3. Smart Money (Whale): 방향성의 결정적 트리거
 * 4. Momentum (MACD): 추세의 지속성 확인
 * * [Data Structure Reference]
 * - rsi: { level: 1~10, val: number }
 * - bb: { widthLevel: 1~7, position: 'UPPER_BREAK'|'LOWER_BREAK'|... }
 * - macd: { status: 'GOLDEN'|'DEAD'|..., level: 1~7 }
 * - whale: { hasBuyFlow: bool, hasSellFlow: bool, maxTier: 1~7, netFlow: number }
 * - volume: { status: 'EXPLOSIVE'|'ACTIVE'|'NORMAL'|'CALM' }
 */

export const ALERT_COMBOS = [
  // =================================================================
  // 🚨 TIER S : "THE SURE THING" (승률 95%+, 즉각 대응)
  // 조건: 기술적 극단(RSI/BB) + 고래의 개입 + 거래량 폭발
  // =================================================================
  {
    id: 'S-01',
    tier: 'S',
    priority: 1,
    type: 'LONG',
    title: 'ABYSSAL SCOOP (심해 줍기)',
    desc: '극단적 공포(RSI L1) + 고래의 대량 매집 + 거래량 폭발. 완벽한 바닥.',
    condition: (d) => (
      d.rsi.level <= 2 &&                     // 1. 가격: 극강 과매도
      d.bb.position === 'LOWER_BREAK' &&      // 2. 위치: 밴드 하단 돌파 (패닉셀)
      d.whale.hasBuyFlow &&                   // 3. 주체: 고래는 사고 있음
      d.whale.maxTier >= 6 &&                 //    (최소 울트라 고래 이상)
      (d.volume.status === 'EXPLOSIVE' || d.volume.status === 'ACTIVE') // 4. 연료: 거래량 실림 (손바뀜)
    )
  },
  {
    id: 'S-02',
    tier: 'S',
    priority: 1,
    type: 'SHORT',
    title: 'LEVIATHAN DUMP (리바이어던 투하)',
    desc: '광기(RSI L10)의 정점에서 고래가 물량을 떠넘기고 있습니다.',
    condition: (d) => (
      d.rsi.level >= 9 &&                     // 1. 가격: 극강 과매수
      d.bb.position === 'UPPER_BREAK' &&      // 2. 위치: 밴드 상단 돌파 (오버슈팅)
      d.whale.hasSellFlow &&                  // 3. 주체: 고래는 팔고 있음
      d.whale.maxTier >= 6 &&                 //    (최소 울트라 고래 이상)
      (d.volume.status === 'EXPLOSIVE' || d.volume.status === 'ACTIVE') // 4. 연료: 거래량 터짐 (고점 신호)
    )
  },
  {
    id: 'S-03',
    tier: 'S',
    priority: 1,
    type: 'LONG',
    title: 'WHALE TORPEDO (고래 어뢰 발사)',
    desc: '응축된 에너지(Squeeze)를 고래가 상방으로 터뜨렸습니다.',
    condition: (d) => (
      d.bb.widthLevel <= 2 &&                 // 1. 변동성: 극강 수축 (Squeeze)
      d.macd.status === 'GOLDEN' &&           // 2. 모멘텀: 골든크로스 시작
      d.macd.level >= 5 &&                    // 3. MACD 강도: histogram >0.05% (강한 신호)
      d.whale.hasBuyFlow &&                   // 4. 주체: 고래 매수 동반
      d.volume.status === 'EXPLOSIVE'         // 5. 연료: 거래량 폭발 (가짜 돌파 아님)
    )
  },
  {
    id: 'S-04',
    tier: 'S',
    priority: 1,
    type: 'SHORT',
    title: 'HULL CRACK (선체 붕괴)',
    desc: '주요 지지선 붕괴 + 고래 투매 + 거래량 실린 하락.',
    condition: (d) => (
      d.bb.widthLevel <= 2 &&                 // 1. 변동성: 수축 상태에서
      d.macd.status === 'DEAD' &&             // 2. 모멘텀: 데드크로스 발생
      d.whale.hasSellFlow &&                  // 3. 주체: 고래 매도 동반
      d.volume.status === 'EXPLOSIVE'         // 4. 연료: 거래량 폭발 (강한 붕괴)
    )
  },

  // =================================================================
  // ⚠️ TIER A : "STRONG TREND" (승률 75%+, 추세 추종/반전)
  // 조건: On-Chain Divergence 또는 강력한 추세 지속
  // =================================================================
  {
    id: 'A-01',
    tier: 'A',
    priority: 2,
    type: 'LONG',
    title: 'SMART DIVERGENCE (스마트 다이버전스)',
    desc: '가격은 떨어지지만 고래는 조용히 매집 중입니다. (시간 가중 분석)',
    condition: (d) => (
      d.price_change_weighted < 0 &&          // 1. 가격: 최근 6h 하락 중 (시간 동기화)
      d.whale.netFlow > 30000000 &&           // 2. 고래: 최소 $30M 순매수 (시간 가중)
      d.whale.buyTotal >= 50000000 &&         // 3. 매수 절대값: 최소 $50M (통계 유의성)
      d.whale.sellTotal >= 20000000 &&        // 4. 매도 절대값: 최소 $20M
      d.whale.buyTotal / d.whale.sellTotal >= 1.5 && // 5. 매수 우위도 1.5배 이상
      d.whale.maxTier >= 5 &&                 // 6. Tier 5+ 고래 포함 ($200M+)
      d.rsi.level <= 4                        // 7. 위치: 저점권
    )
  },
  {
    id: 'A-02',
    tier: 'A',
    priority: 2,
    type: 'SHORT',
    title: 'EXIT DIVERGENCE (탈출 다이버전스)',
    desc: '가격은 오르지만 고래는 조용히 탈출 중입니다. (시간 가중 분석)',
    condition: (d) => (
      d.price_change_weighted > 0 &&          // 1. 가격: 최근 6h 상승 중 (시간 동기화)
      d.whale.netFlow < -30000000 &&          // 2. 고래: 최소 $30M 순매도 (시간 가중)
      d.whale.sellTotal >= 50000000 &&        // 3. 매도 절대값: 최소 $50M (통계 유의성)
      d.whale.buyTotal >= 20000000 &&         // 4. 매수 절대값: 최소 $20M
      d.whale.sellTotal / d.whale.buyTotal >= 1.5 && // 5. 매도 우위도 1.5배 이상
      d.whale.maxTier >= 5 &&                 // 6. Tier 5+ 고래 포함 ($200M+)
      d.rsi.level >= 7                        // 7. 위치: 고점권
    )
  },
  {
    id: 'A-03',
    tier: 'A',
    priority: 2,
    type: 'LONG',
    title: 'FULL THROTTLE (전속 전진)',
    desc: '모든 엔진 가동. 밴드 상단을 타고 오르는 강력한 상승장.',
    condition: (d) => (
      d.bb.position === 'UPPER_ZONE' &&       // 1. 위치: 상단 밴드 유지
      d.macd.level >= 6 &&                    // 2. 모멘텀: 강한 상승세
      d.volume.status !== 'CALM'              // 3. 연료: 거래량 받쳐줌
    )
  },

  // =================================================================
  // 🟡 TIER B : "RADAR CONTACT" (승률 55%+, 관망/준비)
  // 조건: 단일 지표의 의미있는 변화 (Setup 단계)
  // =================================================================
  {
    id: 'B-01',
    tier: 'B',
    priority: 3,
    type: 'HOLD',
    title: 'BB Squeeze 구간',
    desc: '볼린저밴드 강수축 (L1-L2) + 거래량 저하. 변동성 수축 구간.',
    condition: (d) => (
      d.bb.widthLevel <= 2 &&                 // 1. 변동성: 극강~강한 수축 (< 1.5%)
      d.volume.status === 'CALM'              // 2. 거래량: 바닥
    )
  },
  {
    id: 'B-02',
    tier: 'B',
    priority: 3,
    type: 'SHORT',
    title: 'RSI 과매수 영역',
    desc: 'RSI 90+ (L9-10). 기술적 과매수 구간 진입.',
    condition: (d) => (
      d.rsi.level >= 9                        // 단순 과매수 알림
    )
  },
  {
    id: 'B-03',
    tier: 'B',
    priority: 3,
    type: 'LONG',
    title: 'MACD 골든크로스',
    desc: 'MACD 골든크로스 발생 + 거래량 증가. 기술적 패턴 확인.',
    condition: (d) => (
      d.macd.status === 'GOLDEN' &&           // 골든크로스
      d.macd.level >= 5 &&                    // MACD 강도: histogram >0.05% (약한 신호 필터)
      d.volume.status !== 'CALM'              // 거래량 붙음
    )
  }
];