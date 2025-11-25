/**
 * SubMarine Whale Data Classification
 *
 * Based on: INDICATOR_CLASSIFICATION.md
 * Custom 7-tier system with round number boundaries
 * Updated: 2025-11-19
 */

export const whaleTiers = [
  {
    tier: 1,
    name: '소형 고래',
    nameEn: 'Small',
    range: '$10M - $20M',
    rangeKRW: '(약) 140억 - 280억원',
    rangeUSD: [10000000, 20000000],
    frequency: '매우 높음 (일 50-100회)',
    meaning: '가장 작은 규모의 대형 거래',
    strategy: '배경 노이즈. 대량 발생 시만 의미 있음. 개별 거래는 무시. 통계적 분석 전용.',
    color: '#808080',
    priority: 'low'
  },
  {
    tier: 2,
    name: '중소형 고래',
    nameEn: 'Small-Medium',
    range: '$20M - $50M',
    rangeKRW: '(약) 280억 - 700억원',
    rangeUSD: [20000000, 50000000],
    frequency: '매우 높음 (일 20-50회)',
    meaning: '소형 기관 또는 개인 고래',
    strategy: '배경 노이즈 수준. 대량 발생 시 시장 심리 반영. 개별 거래는 무시. 통계적 분석용.',
    color: '#808080',
    priority: 'low'
  },
  {
    tier: 3,
    name: '중형 고래',
    nameEn: 'Medium',
    range: '$50M - $100M',
    rangeKRW: '(약) 700억 - 1,400억원',
    rangeUSD: [50000000, 100000000],
    frequency: '높음 (일 10-20회)',
    meaning: '중소형 기관 또는 중형 고래',
    strategy: '참고 수준. 같은 방향 연속 발생 시 주목. 단독 거래는 무시 가능. 통계적 분석용 데이터.',
    color: '#FFA500',
    priority: 'medium'
  },
  {
    tier: 4,
    name: '대형 고래',
    nameEn: 'Large',
    range: '$100M - $200M',
    rangeKRW: '(약) 1,400억 - 2,800억원',
    rangeUSD: [100000000, 200000000],
    frequency: '보통 (일 5-10회)',
    meaning: '중형 기관 또는 대형 고래',
    strategy: '모니터링 필요. Flow Type 확인. 여러 건 집중 시 의미 있음. 단독 거래는 참고 수준.',
    color: '#FF6666',
    priority: 'medium'
  },
  {
    tier: 5,
    name: '메가 고래',
    nameEn: 'Mega',
    range: '$200M - $500M',
    rangeKRW: '(약) 2,800억 - 7,000억원',
    rangeUSD: [200000000, 500000000],
    frequency: '보통 (일 2-3회)',
    meaning: '중대형 기관의 거래',
    strategy: '알림 확인. Flow Type + RSI 조합. 여러 건 연속 발생 시 추세 확인. 단독 거래는 관찰만.',
    color: '#CC0000',
    priority: 'high'
  },
  {
    tier: 6,
    name: '울트라 고래',
    nameEn: 'Ultra',
    range: '$500M - $1B',
    rangeKRW: '(약) 7,000억 - 1.4조원',
    rangeUSD: [500000000, 1000000000],
    frequency: '드묾 (주 1-2회)',
    meaning: '대형 기관의 포지션 조정',
    strategy: '높은 우선순위 알림. Flow Type 확인. RSI/MACD와 조합 분석. 추세 전환 가능성 주시.',
    color: '#FF0000',
    priority: 'critical'
  },
  {
    tier: 7,
    name: '레전더리 고래',
    nameEn: 'Legendary',
    range: '$1B+',
    rangeKRW: '(약) 1.4조원 이상',
    rangeUSD: [1000000000, Infinity],
    frequency: '극히 드묾 (월 1-2회)',
    meaning: '초대형 기관/고래의 움직임, 시장 주도 세력',
    strategy: '즉시 알림 필수 (S-tier 수준). Flow Type 우선 확인. Inflow일 경우 강력한 상승 신호. Outflow일 경우 강력한 하락 신호. 다른 지표와 즉시 조합 분석.',
    color: '#FF00FF',
    priority: 'critical'
  }
]

export const flowTypes = [
  {
    type: 'inflow',
    name: '인플로우',
    nameEn: 'Inflow',
    direction: 'Exchange → Wallet',
    meaning: '거래소에서 지갑으로 출금',
    impact: '상승 압력',
    impactLevel: 'positive',
    color: 'success',
    bgColor: '#10B981',
    textColor: '#ECFDF5',
    icon: '/icons/inflow.png',
    description: '거래소에서 개인 지갑으로 이동. 장기 보유 의도. 시장에서 코인 제거. 공급 감소로 인한 가격 상승 압력.',
    strategy: '상승 신호로 해석. RSI/MACD와 조합하여 매수 타이밍 포착.'
  },
  {
    type: 'outflow',
    name: '아웃플로우',
    nameEn: 'Outflow',
    direction: 'Wallet → Exchange',
    meaning: '지갑에서 거래소로 입금',
    impact: '하락 압력',
    impactLevel: 'negative',
    color: 'danger',
    bgColor: '#EF4444',
    textColor: '#FEF2F2',
    icon: '/icons/outflow.png',
    description: '개인 지갑에서 거래소로 이동. 매도 준비. 시장에 코인 공급. 공급 증가로 인한 가격 하락 압력.',
    strategy: '하락 신호로 해석. RSI/MACD와 조합하여 익절 또는 매도 타이밍 포착.'
  },
  {
    type: 'exchange',
    name: '거래소 간 이동',
    nameEn: 'Exchange',
    direction: 'Exchange ↔ Exchange',
    meaning: '거래소 간 이동',
    impact: '중립 (유동성)',
    impactLevel: 'neutral',
    color: 'neutral',
    bgColor: '#6B7280',
    textColor: '#F9FAFB',
    icon: '/icons/transfer.png',
    description: '거래소 간 자금 이동. 차익거래 또는 유동성 관리. 직접적인 매수/매도 압력 없음. 시장 영향 제한적.',
    strategy: '중립적 신호. 대량 발생 시 거래소 유동성 변화 관찰.'
  },
  {
    type: 'internal',
    name: '지갑 간 이동',
    nameEn: 'Internal',
    direction: 'Wallet ↔ Wallet',
    meaning: '지갑 간 이동',
    impact: '중립 (재분배)',
    impactLevel: 'neutral',
    color: 'neutral',
    bgColor: '#6B7280',
    textColor: '#F9FAFB',
    icon: '⚪',
    description: '개인 지갑 간 자금 이동. 포트폴리오 재분배 또는 보안 목적. 직접적인 매수/매도 압력 없음. 시장 영향 거의 없음.',
    strategy: '무시 가능. 통계적 목적으로만 추적.'
  },
  {
    type: 'defi',
    name: 'DeFi 활동',
    nameEn: 'DeFi',
    direction: 'Contract 관련',
    meaning: '스마트 컨트랙트',
    impact: 'DeFi 활동',
    impactLevel: 'special',
    color: 'warning',
    bgColor: '#F59E0B',
    textColor: '#FFFBEB',
    icon: '🟡',
    description: '스마트 컨트랙트 관련 거래. DeFi 프로토콜 예금/출금, 스테이킹, 유동성 공급 등. 간접적 시장 영향.',
    strategy: 'DeFi 시장 동향 파악. 대량 유입 시 해당 프로토콜 및 토큰 주목.'
  }
]

/**
 * Calculate whale tier from USD amount
 * @param {number} amountUSD - Transaction amount in USD
 * @returns {number} Tier number (1-7)
 */
export function calculateWhaleTier(amountUSD) {
  if (amountUSD >= 1000000000) return 7      // $1B+
  if (amountUSD >= 500000000) return 6       // $500M-$1B
  if (amountUSD >= 200000000) return 5       // $200M-$500M
  if (amountUSD >= 100000000) return 4       // $100M-$200M
  if (amountUSD >= 50000000) return 3        // $50M-$100M
  if (amountUSD >= 20000000) return 2        // $20M-$50M
  return 1                                    // $10M-$20M
}

/**
 * Calculate whale size in pixels for canvas rendering
 * Linear interpolation between min (8px) and max (60px)
 * @param {number} amountUSD - Transaction amount in USD
 * @returns {number} Size in pixels
 */
export function calculateWhaleSize(amountUSD) {
  const minAmount = 10000000   // $10M
  const maxAmount = 1000000000 // $1B
  const minSize = 8
  const maxSize = 60

  const normalized = (amountUSD - minAmount) / (maxAmount - minAmount)
  const clampedNormalized = Math.min(Math.max(normalized, 0), 1)

  return minSize + clampedNormalized * (maxSize - minSize)
}

/**
 * Get whale tier information by tier number
 * @param {number} tier - Tier number (1-7)
 * @returns {object} Tier information object
 */
export function getWhaleTierInfo(tier) {
  return whaleTiers.find(t => t.tier === tier) || whaleTiers[0]
}

/**
 * Get flow type information by type string
 * @param {string} type - Flow type ('buy', 'sell', 'exchange', 'internal', 'defi')
 * @returns {object} Flow type information object
 */
export function getFlowTypeInfo(type) {
  const lowerType = type.toLowerCase()
  return flowTypes.find(f => f.type === lowerType) || flowTypes[4]
}

/**
 * Whale patterns for analysis
 */
export const whalePatterns = {
  clustering: {
    name: 'Whale Clustering',
    nameKr: '고래 집중',
    description: '같은 Flow Type 거래가 15분 내 3건 이상 (Tier 4+)',
    threshold: {
      count: 3,
      timeWindow: 15 * 60 * 1000, // 15 minutes in ms
      minTier: 4
    },
    significance: 'high',
    strategy: 'Flow Type 방향 추종. RSI/MACD 확인 후 진입.'
  },
  divergence: {
    name: 'Whale Divergence',
    nameKr: '고래 다이버전스',
    description: 'Whale Flow와 가격 움직임 불일치',
    significance: 'critical',
    strategy: 'Whale Flow를 믿고 가격 역방향 포지션. RSI/MACD 확인 필수.'
  },
  silence: {
    name: 'Whale Silence',
    nameKr: '고래 침묵',
    description: '6시간 이상 Tier 4+ 거래 없음',
    threshold: {
      duration: 6 * 60 * 60 * 1000, // 6 hours in ms
      minTier: 4
    },
    significance: 'medium',
    strategy: '신규 진입 보류. Whale Silence 종료 시 방향 확인. 첫 Tier 6+ 거래 방향 추종.'
  },
  legendary: {
    name: 'Legendary Whale Alert',
    nameKr: '레전더리 알림',
    description: 'Tier 7 ($1B+) 거래 발생',
    threshold: {
      tier: 7
    },
    significance: 'critical',
    strategy: '즉시 Flow Type 확인. 다른 지표 즉시 확인. 모든 지표 일치 시 즉시 진입. 리스크 관리 필수.'
  }
}

/**
 * Format USD amount to human-readable string
 * @param {number} amount - Amount in USD
 * @returns {string} Formatted string (e.g., "$1.2B", "$350M")
 */
export function formatWhaleAmount(amount) {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(0)}M`
  }
  return `$${amount.toLocaleString()}`
}
