/**
 * 타임프레임 통합 설정
 * Single Source of Truth for all timeframe-related constants
 *
 * 이 파일은 프로젝트 전체에서 사용되는 타임프레임 관련 상수를 중앙 관리합니다.
 * 타임프레임을 추가/제거할 때는 이 파일만 수정하면 됩니다.
 */

// ===== ACTIVE TIMEFRAMES =====
/**
 * UI에서 선택 가능한 타임프레임 목록
 * Header.jsx의 버튼으로 표시되는 타임프레임
 */
export const ACTIVE_TIMEFRAMES = ['1h', '4h', '8h', '12h', '1d']

// ===== TIMEFRAME DURATIONS =====
/**
 * 각 타임프레임의 지속 시간 (밀리초)
 * 고래 데이터 필터링, lifetime 계산 등에 사용
 */
export const TIMEFRAME_DURATIONS_MS = {
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '8h': 8 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000
}

/**
 * 각 타임프레임의 지속 시간 (초)
 * 고래 물리 엔진 속도 계산에 사용
 */
export const TIMEFRAME_DURATIONS_SECONDS = {
  '1h': 3600,
  '4h': 14400,
  '8h': 28800,
  '12h': 43200,
  '1d': 86400
}

// ===== UTILITY FUNCTIONS =====
/**
 * 타임프레임의 지속 시간을 밀리초로 반환
 * @param {string} timeframe - '1h', '4h', '8h', '12h', '1d'
 * @returns {number} 밀리초 단위 지속 시간
 */
export function getDurationMs(timeframe) {
  return TIMEFRAME_DURATIONS_MS[timeframe] || TIMEFRAME_DURATIONS_MS['1h']
}

/**
 * 타임프레임의 지속 시간을 초로 반환
 * @param {string} timeframe - '1h', '4h', '8h', '12h', '1d'
 * @returns {number} 초 단위 지속 시간
 */
export function getDurationSeconds(timeframe) {
  return TIMEFRAME_DURATIONS_SECONDS[timeframe] || TIMEFRAME_DURATIONS_SECONDS['1h']
}

/**
 * 유효한 타임프레임인지 검증
 * @param {string} timeframe - 검증할 타임프레임
 * @returns {boolean} 유효 여부
 */
export function isValidTimeframe(timeframe) {
  return ACTIVE_TIMEFRAMES.includes(timeframe)
}

// Default export
export default {
  ACTIVE_TIMEFRAMES,
  TIMEFRAME_DURATIONS_MS,
  TIMEFRAME_DURATIONS_SECONDS,
  getDurationMs,
  getDurationSeconds,
  isValidTimeframe
}
