/**
 * Bollinger Bands 데이터
 * INDICATOR_CLASSIFICATION.md 기반
 *
 * Bollinger Bands (BB) - 볼린저 밴드
 * BB Width 7단계 + Price Position 5단계 분류
 */

/**
 * BB Width 7단계 레벨 데이터
 * BB Width % = (BB_Upper - BB_Lower) / BB_Middle × 100
 */
export const bbWidthLevels = [
  {
    level: 7,
    range: '8% 이상',
    name: '극강 확장',
    nameEn: 'Extreme Expansion',
    color: '#FF0000',
    description: '극단적 변동성. 급격한 가격 움직임.',
    strategy: '과도한 변동성 - 진입 자제. 기존 포지션 익절 고려. 급격한 추세 반전 가능성.'
  },
  {
    level: 6,
    range: '6% ~ 8%',
    name: '강한 확장',
    nameEn: 'Strong Expansion',
    color: '#FF6666',
    description: '높은 변동성. 트렌드 가속화.',
    strategy: '트렌드 추종 전략 유효. 손절가 넓게 설정. 변동성 감소 시그널 감지.'
  },
  {
    level: 5,
    range: '4% ~ 6%',
    name: '확장',
    nameEn: 'Expansion',
    color: '#FFA500',
    description: '변동성 증가. 트렌드 형성 중.',
    strategy: '트렌드 진입 타이밍. 방향성 확인 후 진입. 분할 매수/매도.'
  },
  {
    level: 4,
    range: '2.5% ~ 4%',
    name: '정상',
    nameEn: 'Normal',
    color: '#808080',
    description: '정상 변동성. 안정적 추세.',
    strategy: '일반적 트레이딩 환경. 모든 전략 적용 가능. 리스크 관리 표준 적용.'
  },
  {
    level: 3,
    range: '1.5% ~ 2.5%',
    name: '수축',
    nameEn: 'Contraction',
    color: '#66B2FF',
    description: '변동성 감소. 횡보장.',
    strategy: '신규 진입 보류. 브레이크아웃 준비. 타이트한 손절가 설정.'
  },
  {
    level: 2,
    range: '1% ~ 1.5%',
    name: '강한 수축',
    nameEn: 'Strong Squeeze',
    color: '#0080FF',
    description: '낮은 변동성. 브레이크아웃 임박.',
    strategy: 'B-003 Alert 발동 구간. 포지션 진입 대기. 브레이크아웃 방향 예측 (RSI/MACD 보조). 손절/익절 미리 설정.'
  },
  {
    level: 1,
    range: '1% 이하',
    name: '극강 수축',
    nameEn: 'Extreme Squeeze',
    color: '#0000FF',
    description: '극단적 횡보. 폭발적 움직임 임박.',
    strategy: 'Critical Alert - 대형 움직임 직전. 양방향 진입 준비 (롱/숏 모두). 첫 브레이크아웃 방향 즉시 추종. 가짜 돌파(Fake Breakout) 경계.'
  }
];

/**
 * Price Position 5단계 레벨 데이터
 * 가격의 밴드 내 위치 기준
 */
export const bbPositions = [
  {
    level: 5,
    name: '상단 돌파',
    nameEn: 'Above Upper',
    color: '#00FF00',
    description: '과매수 구간. 상승 과열.',
    strategy: '기존 롱 포지션 익절 고려. 신규 매수 자제 (고점 추격 위험). BB 상단 따라 걷기 패턴 확인 (강세장).'
  },
  {
    level: 4,
    name: '상단 영역',
    nameEn: 'Upper Zone',
    color: '#66FF66',
    description: '강세 구간. 매수세 우세.',
    strategy: '상승 추세 진입 타이밍. RSI/MACD 보조 확인. 손절가 BB_Middle 하단.'
  },
  {
    level: 3,
    name: '중립 영역',
    nameEn: 'Middle Zone',
    color: '#808080',
    description: '중립 구간. 방향성 불명.',
    strategy: '관망 (신규 진입 보류). 브레이크아웃 방향 대기. 다른 지표 우선 확인.'
  },
  {
    level: 2,
    name: '하단 영역',
    nameEn: 'Lower Zone',
    color: '#FF6666',
    description: '약세 구간. 매도세 우세.',
    strategy: '하락 추세 진입 타이밍. RSI/MACD 보조 확인. 손절가 BB_Middle 상단.'
  },
  {
    level: 1,
    name: '하단 돌파',
    nameEn: 'Below Lower',
    color: '#FF0000',
    description: '과매도 구간. 하락 과열.',
    strategy: '기존 숏 포지션 익절 고려. 신규 매도 자제 (저점 추격 위험). BB 하단 따라 걷기 패턴 확인 (약세장).'
  }
];

/**
 * BB Width 레벨 계산 함수
 * @param {number} widthPercent - BB Width %
 * @returns {number} Level (1-7)
 */
export function getBBWidthLevel(widthPercent) {
  if (widthPercent >= 8) return 7;
  if (widthPercent >= 6) return 6;
  if (widthPercent >= 4) return 5;
  if (widthPercent >= 2.5) return 4;
  if (widthPercent >= 1.5) return 3;
  if (widthPercent >= 1) return 2;
  return 1;
}

/**
 * BB Width % 계산 함수
 * @param {number} upper - BB Upper
 * @param {number} lower - BB Lower
 * @param {number} middle - BB Middle
 * @returns {number} Width %
 */
export function calculateBBWidthPercent(upper, lower, middle) {
  const width = upper - lower;
  return (width / middle) * 100;
}

/**
 * Price Position 레벨 계산 함수
 * @param {number} price - 현재 가격
 * @param {number} upper - BB Upper
 * @param {number} middle - BB Middle
 * @param {number} lower - BB Lower
 * @returns {number} Position Level (1-5)
 */
export function getBBPositionLevel(price, upper, middle, lower) {
  const middleThreshold = middle * 0.02; // ±2%

  if (price > upper) return 5; // Above Upper
  if (price > middle + middleThreshold) return 4; // Upper Zone
  if (price >= middle - middleThreshold && price <= middle + middleThreshold) return 3; // Middle Zone
  if (price > lower) return 2; // Lower Zone
  return 1; // Below Lower
}

/**
 * BB Width 레벨 정보 가져오기
 * @param {number} widthPercent - BB Width %
 * @returns {object} Level 정보 객체
 */
export function getBBWidthLevelInfo(widthPercent) {
  const level = getBBWidthLevel(widthPercent);
  return bbWidthLevels.find(l => l.level === level);
}

/**
 * BB Position 정보 가져오기
 * @param {number} price - 현재 가격
 * @param {number} upper - BB Upper
 * @param {number} middle - BB Middle
 * @param {number} lower - BB Lower
 * @returns {object} Position 정보 객체
 */
export function getBBPositionInfo(price, upper, middle, lower) {
  const level = getBBPositionLevel(price, upper, middle, lower);
  return bbPositions.find(p => p.level === level);
}

/**
 * BB 패턴 타입
 */
export const bbPatterns = {
  SQUEEZE: {
    name: 'Bollinger Squeeze',
    nameEn: 'BB Squeeze',
    description: 'BB Width < 2% - 브레이크아웃 직전',
    threshold: 2, // Width % < 2%
    signal: 'BREAKOUT_IMMINENT',
    color: '#0080FF'
  },
  EXPANSION: {
    name: 'Bollinger Expansion',
    nameEn: 'BB Expansion',
    description: 'BB Width > 6% - 강한 트렌드',
    threshold: 6, // Width % > 6%
    signal: 'STRONG_TREND',
    color: '#FF6666'
  },
  UPPER_WALKING: {
    name: '상단 따라 걷기',
    nameEn: 'Upper Walking',
    description: 'Price가 BB Upper 근처 유지 (3일+)',
    signal: 'STRONG_UPTREND',
    color: '#00FF00'
  },
  LOWER_WALKING: {
    name: '하단 따라 걷기',
    nameEn: 'Lower Walking',
    description: 'Price가 BB Lower 근처 유지 (3일+)',
    signal: 'STRONG_DOWNTREND',
    color: '#FF0000'
  }
};

/**
 * BB Squeeze 패턴 감지
 * @param {number} widthPercent - BB Width %
 * @returns {boolean} Squeeze 발생 여부
 */
export function detectBBSqueeze(widthPercent) {
  return widthPercent < bbPatterns.SQUEEZE.threshold;
}

/**
 * BB Expansion 패턴 감지
 * @param {number} widthPercent - BB Width %
 * @returns {boolean} Expansion 발생 여부
 */
export function detectBBExpansion(widthPercent) {
  return widthPercent > bbPatterns.EXPANSION.threshold;
}

/**
 * BB 파라미터 (SubMarine 표준)
 */
export const bbParameters = {
  period: 20,
  stdDev: 2,
  values: 'closes' // 종가 기준
};
