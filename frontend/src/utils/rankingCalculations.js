/**
 * Ranking Calculation Utilities
 *
 * 수익률 및 통계 계산을 위한 유틸리티 함수들
 */

/**
 * ROI (Return on Investment) 계산
 * @param {number} currentBalance - 현재 잔액
 * @param {number} initialBalance - 초기 잔액
 * @returns {number} ROI 퍼센트 (-100 ~ Infinity)
 */
export const calculateROI = (currentBalance, initialBalance) => {
  if (!initialBalance || initialBalance === 0) return 0;
  return ((currentBalance - initialBalance) / initialBalance) * 100;
};

/**
 * 승률 (Win Rate) 계산
 * @param {number} winningTrades - 수익 거래 횟수
 * @param {number} totalTrades - 총 거래 횟수
 * @returns {number} 승률 퍼센트 (0 ~ 100)
 */
export const calculateWinRate = (winningTrades, totalTrades) => {
  if (!totalTrades || totalTrades === 0) return 0;
  return (winningTrades / totalTrades) * 100;
};

/**
 * 통화 포맷팅 (USDT)
 * @param {number} value - 금액
 * @param {number} decimals - 소수점 자릿수 (기본: 2)
 * @returns {string} 포맷된 문자열 (예: "10,000.00")
 */
export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0.00';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * 퍼센트 포맷팅
 * @param {number} value - 퍼센트 값
 * @param {number} decimals - 소수점 자릿수 (기본: 2)
 * @param {boolean} showSign - 부호 표시 여부 (기본: true)
 * @returns {string} 포맷된 문자열 (예: "+25.50%" 또는 "-10.25%")
 */
export const formatPercentage = (value, decimals = 2, showSign = true) => {
  if (value === null || value === undefined) return '0.00%';

  const formattedValue = value.toFixed(decimals);
  const sign = showSign && value > 0 ? '+' : '';

  return `${sign}${formattedValue}%`;
};

/**
 * 순위 포맷팅 (숫자 → 텍스트)
 * @param {number} rank - 순위
 * @returns {string} 포맷된 순위 (예: "1st", "2nd", "3rd", "4th")
 */
export const formatRank = (rank) => {
  if (!rank || rank < 1) return '-';

  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = rank % 100;
  const suffix = suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];

  return `${rank}${suffix}`;
};

/**
 * 닉네임 짧게 표시 (모바일용)
 * @param {string} nickname - 닉네임
 * @param {number} maxLength - 최대 길이 (기본: 10)
 * @returns {string} 짧게 표시된 닉네임
 */
export const truncateNickname = (nickname, maxLength = 10) => {
  if (!nickname) return 'Anonymous';
  if (nickname.length <= maxLength) return nickname;
  return `${nickname.slice(0, maxLength)}...`;
};

/**
 * ROI에 따른 색상 클래스 반환
 * @param {number} roi - ROI 퍼센트
 * @returns {string} Tailwind CSS 클래스
 */
export const getROIColorClass = (roi) => {
  if (roi > 0) return 'text-success';
  if (roi < 0) return 'text-danger';
  return 'text-surface-500';
};

/**
 * 승률에 따른 색상 클래스 반환
 * @param {number} winRate - 승률 퍼센트
 * @returns {string} Tailwind CSS 클래스
 */
export const getWinRateColorClass = (winRate) => {
  if (winRate >= 70) return 'text-success';
  if (winRate >= 50) return 'text-surface-600';
  return 'text-danger';
};

/**
 * 순위에 따른 메달 이모지 반환
 * @param {number} rank - 순위
 * @returns {string} 메달 이모지 또는 빈 문자열
 */
export const getRankMedal = (rank) => {
  switch(rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return '';
  }
};

/**
 * 순위에 따른 배경 색상 클래스 반환
 * @param {number} rank - 순위
 * @returns {string} Tailwind CSS 클래스
 */
export const getRankBgClass = (rank) => {
  switch(rank) {
    case 1: return 'bg-primary/10 border-l-4 border-primary';
    case 2: return 'bg-surface-400/20 border-l-4 border-surface-400';
    case 3: return 'bg-warning/10 border-l-4 border-warning';
    default: return '';
  }
};
