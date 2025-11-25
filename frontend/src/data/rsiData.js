/**
 * SubMarine RSI Data Classification
 *
 * Based on: INDICATOR_CLASSIFICATION.md
 * 10-level RSI classification system (0-100 range)
 * Updated: 2025-11-20
 */

export const rsiLevels = [
  {
    level: 1,
    range: '0-10',
    rangeValues: [0, 10],
    name: '극강 과매도',
    nameEn: 'Extreme Oversold',
    color: '#FF0000',
    bgColor: '#FF0000',
    textColor: '#FFFFFF',
    status: 'EXTREME OVERSOLD',
    description: '극단적 과매도. 시장 공포 상태.',
    descriptionEn: 'Extreme oversold. Market fear state.',
    frequency: '극히 드묾 (연 5-10회, 주요 폭락 말기)',
    duration: '2-6시간 (장기간 유지 불가)',
    risk: '극도로 높음 (반등 확률 85%+)',
    riskLevel: 'critical',
    strategy: '적극적 매수 기회. 신규 매도 절대 금지. 추세 반전 임박 경계. C-001 Alert 발동 구간 (Level 3 → 1 급락 시).',
    strategyEn: 'Aggressive buy opportunity. Never sell new. Trend reversal imminent.',
    actions: [
      '적극적 매수 기회',
      '신규 매도 절대 금지',
      '추세 반전 임박 경계',
      'MACD 골든크로스 감지 준비'
    ],
    profitRatio: '1:5 이상 (강력한 반등 기대)',
    position: '신규 매수 100% (분할 진입)',
    stopLoss: '넓게 설정 (-10% 허용)',
    marketContext: {
      bull: '거의 발생 안함 (발생 시 강력한 매수 기회)',
      bear: 'RSI 10 도달 후 30-50% 반등',
      sideways: '극히 드묾'
    }
  },
  {
    level: 2,
    range: '10-20',
    rangeValues: [10, 20],
    name: '매우 과매도',
    nameEn: 'Very Oversold',
    color: '#CC0000',
    bgColor: '#CC0000',
    textColor: '#FFFFFF',
    status: 'VERY OVERSOLD',
    description: '강한 과매도. 반등 임박.',
    descriptionEn: 'Strong oversold. Bounce imminent.',
    frequency: '드묾',
    duration: '수시간 ~ 1일',
    risk: '높음 (반등 확률 70%+)',
    riskLevel: 'high',
    strategy: '분할 매수 시작. 신규 매도 자제. 손절가 넓게 설정. MACD 골든크로스 감지 준비.',
    strategyEn: 'Start DCA buying. Avoid new shorts. Set wide stop loss. Prepare for MACD golden cross.',
    actions: [
      '분할 매수 시작',
      '신규 매도 자제',
      '손절가 넓게 설정',
      'MACD 골든크로스 대기'
    ],
    profitRatio: '1:3',
    position: '신규 매수 75%',
    stopLoss: '넓게 설정 (-7%)',
    marketContext: {
      bull: 'RSI 20 터치 후 즉시 반등',
      bear: '단기 반등 후 재하락 가능',
      sideways: '드묾'
    }
  },
  {
    level: 3,
    range: '20-30',
    rangeValues: [20, 30],
    name: '과매도',
    nameEn: 'Oversold',
    color: '#FF6666',
    bgColor: '#FF6666',
    textColor: '#FFFFFF',
    status: 'OVERSOLD',
    description: '과매도 구간. 매수 고려.',
    descriptionEn: 'Oversold zone. Consider buying.',
    frequency: '보통',
    duration: '1-3일',
    risk: '중간 (반등 확률 60%+)',
    riskLevel: 'medium',
    strategy: '부분 매수 고려. 추가 매도 신중. RSI 30 상향 돌파 시 매수 신호. BB 하단 돌파 여부 확인.',
    strategyEn: 'Consider partial buy. Careful with additional shorts. RSI 30 breakout = buy signal. Check BB lower band.',
    actions: [
      '부분 매수 고려',
      '추가 매도 신중',
      'RSI 30 상향 돌파 시 매수 신호',
      'BB 하단 돌파 여부 확인'
    ],
    profitRatio: '1:2',
    position: '신규 매수 50%',
    stopLoss: '표준 설정 (-5%)',
    marketContext: {
      bull: '좋은 매수 기회',
      bear: '단기 반등 가능',
      sideways: '지지선 확인 후 매수'
    }
  },
  {
    level: 4,
    range: '30-40',
    rangeValues: [30, 40],
    name: '약세',
    nameEn: 'Bearish',
    color: '#FFA500',
    bgColor: '#FFA500',
    textColor: '#000000',
    status: 'BEARISH',
    description: '하락 추세 지속. 약세 확인.',
    descriptionEn: 'Downtrend continues. Bearish confirmed.',
    frequency: '높음',
    duration: '수일',
    risk: '중간',
    riskLevel: 'medium',
    strategy: '하락 추세 진입 타이밍. 추세 추종 매도 전략. 손절가 RSI 50 상단. MACD + BB 조합 확인.',
    strategyEn: 'Downtrend entry timing. Trend-following short strategy. Stop loss at RSI 50. Check MACD + BB.',
    actions: [
      '하락 추세 진입 타이밍',
      '추세 추종 매도 전략',
      '손절가 RSI 50 상단',
      'MACD + BB 조합 확인'
    ],
    profitRatio: '1:1.5',
    position: '매도 포지션 가능',
    stopLoss: 'RSI 50 돌파 시',
    marketContext: {
      bull: '일시적 조정',
      bear: '하락 추세 확인',
      sideways: '하단 이탈'
    }
  },
  {
    level: 5,
    range: '40-50',
    rangeValues: [40, 50],
    name: '중립 하단',
    nameEn: 'Neutral Low',
    color: '#808080',
    bgColor: '#808080',
    textColor: '#FFFFFF',
    status: 'NEUTRAL LOW',
    description: '매도세 우위. 중립선 하단.',
    descriptionEn: 'Sellers dominant. Below neutral.',
    frequency: '매우 높음',
    duration: '지속적',
    risk: '낮음',
    riskLevel: 'low',
    strategy: '신규 진입 보류. RSI 50 돌파 여부 관찰. 하향 돌파 시 매도 신호. MACD 교차 신호 대기.',
    strategyEn: 'Hold new entries. Watch RSI 50 breakout. Break down = sell signal. Wait for MACD cross.',
    actions: [
      '신규 진입 보류',
      'RSI 50 돌파 여부 관찰',
      '하향 돌파 시 매도 신호',
      'MACD 교차 신호 대기'
    ],
    profitRatio: '불명확',
    position: '관망 (기존 포지션 유지)',
    stopLoss: '기존 손절가 유지',
    marketContext: {
      bull: '조정 후 재상승 대기',
      bear: '약세 지속',
      sideways: '중립선 하단 횡보'
    }
  },
  {
    level: 6,
    range: '50-60',
    rangeValues: [50, 60],
    name: '중립 상단',
    nameEn: 'Neutral High',
    color: '#808080',
    bgColor: '#808080',
    textColor: '#FFFFFF',
    status: 'NEUTRAL HIGH',
    description: '매수세 우위. 중립선 상단.',
    descriptionEn: 'Buyers dominant. Above neutral.',
    frequency: '매우 높음',
    duration: '지속적',
    risk: '낮음',
    riskLevel: 'low',
    strategy: '신규 매수 진입 가능. RSI 50 지지 확인. 방향성 불명확 시 관망. MACD 골든크로스 대기.',
    strategyEn: 'New long entries possible. Confirm RSI 50 support. Wait if direction unclear. Wait for MACD golden cross.',
    actions: [
      '신규 매수 진입 가능',
      'RSI 50 지지 확인',
      '방향성 불명확 시 관망',
      'MACD 골든크로스 대기'
    ],
    profitRatio: '1:2',
    position: '신규 매수 25%',
    stopLoss: 'RSI 50 하향 돌파 시',
    marketContext: {
      bull: '상승 추세 진입',
      bear: '일시적 반등',
      sideways: '중립선 상단 횡보'
    }
  },
  {
    level: 7,
    range: '60-70',
    rangeValues: [60, 70],
    name: '강세',
    nameEn: 'Bullish',
    color: '#00BFFF',
    bgColor: '#00BFFF',
    textColor: '#000000',
    status: 'BULLISH',
    description: '건강한 상승 추세. 강세 확인.',
    descriptionEn: 'Healthy uptrend. Bullish confirmed.',
    frequency: '높음',
    duration: '수일',
    risk: '중간',
    riskLevel: 'medium',
    strategy: '상승 추세 진입 타이밍. 추세 추종 전략 유효. 손절가 RSI 50 하단. MACD + BB 조합 확인.',
    strategyEn: 'Uptrend entry timing. Trend-following strategy valid. Stop loss below RSI 50. Check MACD + BB.',
    actions: [
      '상승 추세 진입 타이밍',
      '추세 추종 전략 유효',
      '손절가 RSI 50 하단',
      'MACD + BB 조합 확인'
    ],
    profitRatio: '1:2',
    position: '신규 매수 50%',
    stopLoss: 'RSI 50 하향 돌파 시',
    marketContext: {
      bull: '상승 추세 확인',
      bear: '강력한 반등',
      sideways: '상단 돌파'
    }
  },
  {
    level: 8,
    range: '70-80',
    rangeValues: [70, 80],
    name: '과매수',
    nameEn: 'Overbought',
    color: '#66FF66',
    bgColor: '#66FF66',
    textColor: '#000000',
    status: 'OVERBOUGHT',
    description: '과매수 구간. 익절 고려.',
    descriptionEn: 'Overbought zone. Consider taking profits.',
    frequency: '보통',
    duration: '1-3일',
    risk: '중간 (조정 확률 60%+)',
    riskLevel: 'medium',
    strategy: '부분 익절 고려. 추가 매수 신중. RSI 70 하향 돌파 시 익절 신호. BB 상단 돌파 여부 확인.',
    strategyEn: 'Consider partial profit taking. Careful with additional longs. RSI 70 break down = take profit signal.',
    actions: [
      '부분 익절 고려',
      '추가 매수 신중',
      'RSI 70 하향 돌파 시 익절 신호',
      'BB 상단 돌파 여부 확인'
    ],
    profitRatio: '1:1 (추가 상승 제한적)',
    position: '익절 25% (기존 포지션)',
    stopLoss: '타이트하게 관리 (-3%)',
    marketContext: {
      bull: '과열 경계, 조정 가능',
      bear: '거의 발생 안함',
      sideways: '드묾'
    }
  },
  {
    level: 9,
    range: '80-90',
    rangeValues: [80, 90],
    name: '매우 과매수',
    nameEn: 'Very Overbought',
    color: '#00CC00',
    bgColor: '#00CC00',
    textColor: '#FFFFFF',
    status: 'VERY OVERBOUGHT',
    description: '강한 과매수. 조정 임박.',
    descriptionEn: 'Strong overbought. Correction imminent.',
    frequency: '드묾',
    duration: '수시간 ~ 1일',
    risk: '높음 (조정 확률 70%+)',
    riskLevel: 'high',
    strategy: '분할 익절 시작. 신규 매수 자제. 손절가 타이트하게 관리. MACD 데드크로스 감지 준비.',
    strategyEn: 'Start DCA profit taking. Avoid new longs. Manage tight stop loss. Prepare for MACD death cross.',
    actions: [
      '분할 익절 시작',
      '신규 매수 자제',
      '손절가 타이트하게 관리',
      'MACD 데드크로스 감지 준비'
    ],
    profitRatio: '1:0.5 (추가 상승 매우 제한적)',
    position: '익절 50% (기존 포지션)',
    stopLoss: '매우 타이트 (-2%)',
    marketContext: {
      bull: 'RSI 80 터치 후 조정',
      bear: '거의 발생 안함',
      sideways: '극히 드묾'
    }
  },
  {
    level: 10,
    range: '90-100',
    rangeValues: [90, 100],
    name: '극강 과매수',
    nameEn: 'Extreme Overbought',
    color: '#00FF00',
    bgColor: '#00FF00',
    textColor: '#000000',
    status: 'EXTREME OVERBOUGHT',
    description: '극단적 과매수. 시장 광기 상태.',
    descriptionEn: 'Extreme overbought. Market euphoria state.',
    frequency: '극히 드묾 (연 5-10회, 주요 랠리 말기)',
    duration: '2-6시간 (장기간 유지 불가)',
    risk: '극도로 높음 (조정 확률 85%+)',
    riskLevel: 'critical',
    strategy: '전량 익절 강력 추천 (100% 포지션 청산). 신규 매수 절대 금지 (FOMO 저항). 추세 반전 임박 경계. C-001 Alert 발동 구간 (Level 8 → 10 급상승 시).',
    strategyEn: 'Full profit taking strongly recommended. Never buy new (resist FOMO). Trend reversal imminent.',
    actions: [
      '전량 익절 강력 추천 (100% 포지션 청산)',
      '신규 매수 절대 금지 (FOMO 저항)',
      '추세 반전 임박 경계',
      'C-001 Alert 발동'
    ],
    profitRatio: '1:0.2 (추가 상승 여력 제한적)',
    position: '신규 진입 금지, 기존 포지션 0%',
    stopLoss: '즉시 전량 익절 (지체 시 -10~20% 손실 위험)',
    marketContext: {
      bull: 'RSI 90+ 도달 후 10-20% 조정',
      bear: '거의 발생 안함 (발생 시 단기 반등)',
      sideways: '극히 드묾'
    },
    psychology: {
      emotion: '극도의 탐욕, FOMO (Fear Of Missing Out)',
      afterEffect: '익절 후 추가 상승 시 후회감',
      reminder: '냉정함 유지 - "10% 놓치는 것보다 30% 잃는 게 위험"'
    },
    failureCase: '강한 상승 모멘텀에서 RSI 90+ 유지 (3-5일). 이 경우에도 분할 익절 필수 (과욕 금물). "이번엔 다르다" 심리 → 가장 위험.'
  }
]

/**
 * RSI Divergence patterns
 */
export const rsiDivergence = {
  bearish: {
    name: 'Bearish Divergence',
    nameKr: '약세 다이버전스',
    pattern: {
      price: 'Higher High (고점 상승)',
      rsi: 'Lower High (고점 하락)'
    },
    meaning: '상승 추세 약화, 조정 임박',
    example: {
      price: '$50,000 → $52,000 → $54,000',
      rsi: 'Level 8 (75) → Level 7.5 (72) → Level 7 (68)',
      result: '매수 모멘텀 약화 → 조정 시작'
    },
    strategy: '익절 타이밍. 매도 포지션 진입. MACD 데드크로스 동반 시 신뢰도 상승.',
    reliability: 'MACD 데드크로스 동반 시 높음'
  },
  bullish: {
    name: 'Bullish Divergence',
    nameKr: '강세 다이버전스',
    pattern: {
      price: 'Lower Low (저점 하락)',
      rsi: 'Higher Low (저점 상승)'
    },
    meaning: '하락 추세 약화, 반등 임박',
    example: {
      price: '$50,000 → $48,000 → $46,000',
      rsi: 'Level 3 (25) → Level 3.5 (28) → Level 4 (32)',
      result: '매도 모멘텀 약화 → 반등 시작'
    },
    strategy: '매수 타이밍. 숏 포지션 청산. MACD 골든크로스 동반 시 신뢰도 상승.',
    reliability: 'MACD 골든크로스 동반 시 높음'
  }
}

/**
 * RSI Parameters used in SubMarine
 */
export const rsiParameters = {
  period: 14,
  values: 'closes',
  calculation: {
    formula: 'RSI = 100 - (100 / (1 + RS))',
    rs: 'Average Gain (14) / Average Loss (14)',
    range: '0-100',
    interpretations: {
      100: '14일간 상승만 발생',
      0: '14일간 하락만 발생',
      50: '상승/하락 동일'
    }
  }
}

/**
 * Get RSI level from RSI value
 * @param {number} rsi - RSI value (0-100)
 * @returns {number} Level number (1-10)
 */
export function getRSILevel(rsi) {
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

/**
 * Get RSI level information by level number
 * @param {number} level - Level number (1-10)
 * @returns {object} RSI level information object
 */
export function getRSILevelInfo(level) {
  return rsiLevels.find(l => l.level === level) || rsiLevels[4] // Default to neutral
}

/**
 * Get RSI level information by RSI value
 * @param {number} rsi - RSI value (0-100)
 * @returns {object} RSI level information object
 */
export function getRSIInfo(rsi) {
  const level = getRSILevel(rsi)
  return getRSILevelInfo(level)
}

/**
 * Check if RSI level change is significant (2+ levels)
 * Used for C-001 Alert trigger
 * @param {number} prevRSI - Previous RSI value
 * @param {number} currentRSI - Current RSI value
 * @returns {object|null} Alert info if significant, null otherwise
 */
export function checkRSILevelChange(prevRSI, currentRSI) {
  const prevLevel = getRSILevel(prevRSI)
  const currentLevel = getRSILevel(currentRSI)
  const levelChange = Math.abs(currentLevel - prevLevel)

  if (levelChange >= 2) {
    return {
      tier: 'C',
      code: 'C-001',
      message: `RSI Level Change - L${prevLevel} → L${currentLevel}`,
      prevLevel,
      currentLevel,
      levelChange,
      direction: currentLevel > prevLevel ? 'up' : 'down'
    }
  }

  return null
}

/**
 * RSI combination strategies with other indicators
 */
export const rsiCombinations = {
  withMACD: [
    {
      condition: 'RSI L8-10 + MACD Death Cross',
      signal: 'strong_sell',
      strength: 'critical',
      description: '강력한 매도 신호'
    },
    {
      condition: 'RSI L1-3 + MACD Golden Cross',
      signal: 'strong_buy',
      strength: 'critical',
      description: '강력한 매수 신호'
    },
    {
      condition: 'RSI L6-7 + MACD L5-7',
      signal: 'uptrend_confirmed',
      strength: 'high',
      description: '상승 추세 확인'
    },
    {
      condition: 'RSI L4-5 + MACD L3-1',
      signal: 'downtrend_confirmed',
      strength: 'high',
      description: '하락 추세 확인'
    },
    {
      condition: 'RSI/MACD Simultaneous Divergence',
      signal: 'trend_reversal',
      strength: 'critical',
      description: '추세 전환 확신'
    }
  ],
  withBB: [
    {
      condition: 'RSI > 80 + Price > BB_Upper',
      signal: 'extreme_overbought',
      strength: 'critical',
      description: '극단적 과매수 (익절)'
    },
    {
      condition: 'RSI < 20 + Price < BB_Lower',
      signal: 'extreme_oversold',
      strength: 'critical',
      description: '극단적 과매도 (매수)'
    },
    {
      condition: 'RSI Neutral + BB Squeeze',
      signal: 'breakout_pending',
      strength: 'medium',
      description: '브레이크아웃 대기'
    },
    {
      condition: 'RSI L7-8 + BB Expansion',
      signal: 'uptrend_acceleration',
      strength: 'high',
      description: '상승 트렌드 가속'
    }
  ],
  withWhale: [
    {
      condition: 'Tier 6+ Buy + RSI L1-3',
      signal: 'strong_bottom',
      strength: 'critical',
      description: '강력한 바닥 신호'
    },
    {
      condition: 'Tier 6+ Sell + RSI L8-10',
      signal: 'strong_top',
      strength: 'critical',
      description: '강력한 고점 신호'
    },
    {
      condition: 'Whale Divergence + RSI Extreme',
      signal: 'trend_reversal',
      strength: 'critical',
      description: '추세 전환 확신'
    },
    {
      condition: 'Whale Clustering + RSI Neutral',
      signal: 'new_trend_start',
      strength: 'high',
      description: '새로운 추세 시작'
    }
  ]
}

/**
 * RSI warnings and reminders
 */
export const rsiWarnings = {
  aloneUsage: 'RSI는 후행 지표 - 추세 확인용. 반드시 다른 지표와 함께 사용 (MACD, BB 필수).',
  strongTrend: '강한 트렌드에서는 장기간 과열/과매도 유지 가능.',
  dynamicSupport: 'RSI 50은 동적 지지/저항선 역할.',
  fomo: 'RSI 90+ 구간에서 FOMO (Fear Of Missing Out) 경계. "10% 놓치는 것보다 30% 잃는 게 위험".'
}
