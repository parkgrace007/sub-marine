/**
 * MACD 7단계 레벨 데이터
 * INDICATOR_CLASSIFICATION.md 기반
 *
 * MACD (Moving Average Convergence Divergence) - 이동평균 수렴확산 지수
 * Histogram 기준 7단계 분류
 */

export const macdLevels = [
  {
    level: 7,
    range: '+50 이상',
    name: '극 매수세',
    nameEn: 'Extreme Bullish',
    color: '#00FF00',
    description: '극단적 상승 모멘텀. 과열 경계.',
    strategy: '단기 익절 고려. 추세 과열 경계. RSI 70+ 동반 시 조정 임박.'
  },
  {
    level: 6,
    range: '+20 ~ +50',
    name: '강한 매수세',
    nameEn: 'Very Bullish',
    color: '#00CC00',
    description: '강력한 상승 추세. 매수세 우위.',
    strategy: '추세 추종 매수. 손절가 상향 조정. 분할 익절 전략.'
  },
  {
    level: 5,
    range: '+5 ~ +20',
    name: '매수세',
    nameEn: 'Bullish',
    color: '#66FF66',
    description: '상승 추세 지속. 매수 신호.',
    strategy: '신규 매수 진입. 골든크로스 후 추가 확인. 추세 지속 관찰.'
  },
  {
    level: 4,
    range: '-5 ~ +5',
    name: '중립',
    nameEn: 'Neutral',
    color: '#808080',
    description: '모멘텀 없음. 방향성 불명.',
    strategy: '관망 (신규 진입 보류). 브레이크아웃 대기. 다른 지표 보조 필요.'
  },
  {
    level: 3,
    range: '-20 ~ -5',
    name: '매도세',
    nameEn: 'Bearish',
    color: '#FF6666',
    description: '하락 추세 지속. 매도 신호.',
    strategy: '신규 매도 진입. 데드크로스 후 추가 확인. 추세 지속 관찰.'
  },
  {
    level: 2,
    range: '-50 ~ -20',
    name: '강한 매도세',
    nameEn: 'Very Bearish',
    color: '#CC0000',
    description: '강력한 하락 추세. 매도세 우위.',
    strategy: '추세 추종 매도. 손절가 하향 조정. 분할 손절 전략.'
  },
  {
    level: 1,
    range: '-50 이하',
    name: '극 매도세',
    nameEn: 'Extreme Bearish',
    color: '#FF0000',
    description: '극단적 하락 모멘텀. 과매도 경계.',
    strategy: '전량 손절 고려. 추세 과매도 경계. RSI 30- 동반 시 반등 임박.'
  }
];

/**
 * MACD 레벨 계산 함수
 * @param {number} histogram - MACD Histogram 값
 * @returns {number} Level (1-7)
 */
export function getMACDLevel(histogram) {
  if (histogram >= 50) return 7;
  if (histogram >= 20) return 6;
  if (histogram >= 5) return 5;
  if (histogram >= -5) return 4;
  if (histogram >= -20) return 3;
  if (histogram >= -50) return 2;
  return 1;
}

/**
 * MACD 레벨 정보 가져오기
 * @param {number} histogram - MACD Histogram 값
 * @returns {object} Level 정보 객체
 */
export function getMACDLevelInfo(histogram) {
  const level = getMACDLevel(histogram);
  return macdLevels.find(l => l.level === level);
}

/**
 * MACD 교차 신호 타입
 */
export const macdCrossSignals = {
  GOLDEN_CROSS: {
    name: '골든크로스',
    nameEn: 'Golden Cross',
    description: 'MACD Line이 Signal Line을 상향 돌파',
    signal: 'BUY',
    color: '#00FF00'
  },
  DEATH_CROSS: {
    name: '데드크로스',
    nameEn: 'Death Cross',
    description: 'MACD Line이 Signal Line을 하향 돌파',
    signal: 'SELL',
    color: '#FF0000'
  }
};

/**
 * MACD 교차 신호 감지
 * @param {number} currentHistogram - 현재 Histogram
 * @param {number} prevHistogram - 이전 Histogram
 * @returns {object|null} 교차 신호 또는 null
 */
export function detectMACDCross(currentHistogram, prevHistogram) {
  // Golden Cross: 음수 → 양수
  if (prevHistogram <= 0 && currentHistogram > 0) {
    return macdCrossSignals.GOLDEN_CROSS;
  }

  // Death Cross: 양수 → 음수
  if (prevHistogram >= 0 && currentHistogram < 0) {
    return macdCrossSignals.DEATH_CROSS;
  }

  return null;
}

/**
 * MACD 파라미터 (SubMarine 표준)
 */
export const macdParameters = {
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
  SimpleMAOscillator: false,
  SimpleMASignal: false
};
