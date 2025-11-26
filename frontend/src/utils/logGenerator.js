/**
 * logGenerator.js - SubMarine Indicator Log Generator
 *
 * Purpose: Generate logs using ONLY templates from SubMarine_LogTemplates.js
 * Rules:
 * 1. NEVER create custom text - use templates ONLY
 * 2. Replace placeholders: {val}, {level}, {tier}, {amount}, {flow}
 * 3. Return log objects: { text, type, timestamp }
 * 4. Support bilingual output (ko/en) via getLogText helper
 */

import { LOG_TEMPLATES, getLogText } from '../constants/SubMarine_LogTemplates'

/**
 * Replace placeholders in template string
 * @param {string} template - Template string with placeholders
 * @param {object} values - Values to replace: {val, level, tier, amount, flow}
 * @returns {string} Processed string
 */
function replacePlaceholders(template, values = {}) {
  let result = template

  if (values.val !== undefined) {
    result = result.replace('{val}', values.val)
  }
  if (values.level !== undefined) {
    result = result.replace('{level}', values.level)
  }
  if (values.tier !== undefined) {
    result = result.replace('{tier}', values.tier)
  }
  if (values.amount !== undefined) {
    result = result.replace('{amount}', values.amount)
  }
  if (values.flow !== undefined) {
    result = result.replace('{flow}', values.flow)
  }
  if (values.prev !== undefined) {
    result = result.replace('{prev}', values.prev)
  }
  if (values.curr !== undefined) {
    result = result.replace('{curr}', values.curr)
  }

  return result
}

/**
 * Calculate RSI level (1-10)
 * @param {number} rsi - RSI value (0-100)
 * @returns {number} Level (1-10)
 */
function getRSILevel(rsi) {
  if (rsi >= 90) return 10 // 90-100: 극강 과매수
  if (rsi >= 80) return 9  // 80-90: 매우 과매수
  if (rsi >= 70) return 8  // 70-80: 과매수
  if (rsi >= 60) return 7  // 60-70: 강세
  if (rsi >= 50) return 6  // 50-60: 약강세 (중립 없음 - 템플릿 없음)
  if (rsi >= 40) return 5  // 40-50: 약약세 (중립 없음 - 템플릿 없음)
  if (rsi >= 30) return 4  // 30-40: 약세
  if (rsi >= 20) return 3  // 20-30: 과매도
  if (rsi >= 10) return 2  // 10-20: 매우 과매도
  return 1                 // 0-10: 극강 과매도
}

/**
 * Generate RSI log
 * @param {number} rsiValue - Current RSI value
 * @param {number} prevValue - Previous RSI value (for cross detection)
 * @param {string} lang - Language code ('ko' or 'en')
 * @returns {object|null} Log object or null
 */
export function generateRSILog(rsiValue, prevValue, lang = 'ko') {
  if (rsiValue === null || rsiValue === undefined || isNaN(rsiValue)) return null
  if (prevValue === null || prevValue === undefined || isNaN(prevValue)) {
    // First run - no previous value, just report level
    prevValue = rsiValue
  }

  const currentLevel = getRSILevel(rsiValue)
  const prevLevel = getRSILevel(prevValue)

  // Check 50-line cross first (higher priority)
  if (prevValue < 50 && rsiValue >= 50) {
    const template = LOG_TEMPLATES.RSI.CROSS_UP_50
    return {
      signal_key: 'RSI_CROSS_UP_50',
      params: {},
      text: getLogText(template, lang),
      type: template.type,
      timestamp: new Date().toISOString()
    }
  }
  if (prevValue >= 50 && rsiValue < 50) {
    const template = LOG_TEMPLATES.RSI.CROSS_DOWN_50
    return {
      signal_key: 'RSI_CROSS_DOWN_50',
      params: {},
      text: getLogText(template, lang),
      type: template.type,
      timestamp: new Date().toISOString()
    }
  }

  // Check level change - only log if level changed and template exists
  if (currentLevel !== prevLevel) {
    const templateKey = `LEVEL_${currentLevel}`
    const template = LOG_TEMPLATES.RSI[templateKey]

    // Only log for levels with templates (L1, L2, L3, L4, L7, L8, L9, L10)
    if (template) {
      const params = { val: rsiValue.toFixed(1) }
      const text = replacePlaceholders(getLogText(template, lang), params)
      return {
        signal_key: `RSI_LEVEL_${currentLevel}`,
        params,
        text,
        type: template.type,
        timestamp: new Date().toISOString()
      }
    }
  }

  return null
}

/**
 * Generate MACD log
 * @param {number} histogram - Current MACD histogram
 * @param {number} prevHistogram - Previous MACD histogram
 * @param {number} macdLine - MACD line (for zero cross detection)
 * @param {number} prevMacdLine - Previous MACD line
 * @param {string} lang - Language code ('ko' or 'en')
 * @returns {object|null} Log object or null
 */
export function generateMACDLog(histogram, prevHistogram, macdLine = null, prevMacdLine = null, lang = 'ko') {
  if (histogram === null || histogram === undefined || isNaN(histogram)) return null
  if (prevHistogram === null || prevHistogram === undefined || isNaN(prevHistogram)) {
    prevHistogram = histogram // First run
  }

  // Golden Cross: histogram crosses from negative to positive
  if (prevHistogram < 0 && histogram >= 0) {
    const template = LOG_TEMPLATES.MACD.GOLDEN_CROSS
    return {
      signal_key: 'MACD_GOLDEN_CROSS',
      params: {},
      text: getLogText(template, lang),
      type: template.type,
      timestamp: new Date().toISOString()
    }
  }

  // Death Cross: histogram crosses from positive to negative
  if (prevHistogram >= 0 && histogram < 0) {
    const template = LOG_TEMPLATES.MACD.DEATH_CROSS
    return {
      signal_key: 'MACD_DEATH_CROSS',
      params: {},
      text: getLogText(template, lang),
      type: template.type,
      timestamp: new Date().toISOString()
    }
  }

  // Zero Line Cross (if MACD line provided)
  if (macdLine !== null && prevMacdLine !== null) {
    if (prevMacdLine < 0 && macdLine >= 0) {
      const template = LOG_TEMPLATES.MACD.ZERO_CROSS_UP
      return {
        signal_key: 'MACD_ZERO_CROSS_UP',
        params: {},
        text: getLogText(template, lang),
        type: template.type,
        timestamp: new Date().toISOString()
      }
    }
    if (prevMacdLine >= 0 && macdLine < 0) {
      const template = LOG_TEMPLATES.MACD.ZERO_CROSS_DOWN
      return {
        signal_key: 'MACD_ZERO_CROSS_DOWN',
        params: {},
        text: getLogText(template, lang),
        type: template.type,
        timestamp: new Date().toISOString()
      }
    }
  }

  // Extreme Histogram (L7: +50+, L1: -50-)
  // Only trigger when entering extreme zone
  const wasExtremeBullish = prevHistogram >= 50
  const isExtremeBullish = histogram >= 50
  if (!wasExtremeBullish && isExtremeBullish) {
    const template = LOG_TEMPLATES.MACD.EXTREME_BULLISH
    return {
      signal_key: 'MACD_EXTREME_BULLISH',
      params: {},
      text: getLogText(template, lang),
      type: template.type,
      timestamp: new Date().toISOString()
    }
  }

  const wasExtremeBearish = prevHistogram <= -50
  const isExtremeBearish = histogram <= -50
  if (!wasExtremeBearish && isExtremeBearish) {
    const template = LOG_TEMPLATES.MACD.EXTREME_BEARISH
    return {
      signal_key: 'MACD_EXTREME_BEARISH',
      params: {},
      text: getLogText(template, lang),
      type: template.type,
      timestamp: new Date().toISOString()
    }
  }

  return null
}

/**
 * Get BB Width level (1-7)
 * @param {number} width - BB Width percentage
 * @returns {number} Level (1-7)
 */
function getBBWidthLevel(width) {
  if (width >= 8) return 7   // 8%+: 극강 확장
  if (width >= 6) return 6   // 6-8%: 강한 확장
  if (width >= 4) return 5   // 4-6%: 확장
  if (width >= 3) return 4   // 3-4%: 보통
  if (width >= 2) return 3   // 2-3%: 약한 수축
  if (width >= 1) return 2   // 1-2%: 수축
  return 1                   // 0-1%: 극강 수축 (Squeeze)
}

/**
 * Get BB Position level (1-5)
 * @param {number} price - Current price
 * @param {number} upper - BB upper band
 * @param {number} middle - BB middle band
 * @param {number} lower - BB lower band
 * @returns {number} Level (1-5)
 */
function getBBPositionLevel(price, upper, middle, lower) {
  if (price > upper) return 5      // 상단 돌파
  if (price > middle) return 4     // 상단-중간
  if (price > lower) return 2      // 중간-하단
  return 1                         // 하단 이탈
}

/**
 * Generate Bollinger Bands log
 * @param {number} width - Current BB width percentage
 * @param {number} prevWidth - Previous BB width
 * @param {object} position - {price, upper, middle, lower}
 * @param {object} prevPosition - Previous position
 * @param {string} lang - Language code ('ko' or 'en')
 * @returns {object|null} Log object or null
 */
export function generateBBLog(width, prevWidth, position = null, prevPosition = null, lang = 'ko') {
  if (width === null || width === undefined || isNaN(width)) return null
  if (prevWidth === null || prevWidth === undefined || isNaN(prevWidth)) {
    prevWidth = width // First run
  }

  const currentWidthLevel = getBBWidthLevel(width)
  const prevWidthLevel = getBBWidthLevel(prevWidth)

  // Width level changes - only extreme squeeze (L1) and strong expansion (L6)
  if (currentWidthLevel === 1 && prevWidthLevel !== 1) {
    const template = LOG_TEMPLATES.BB.EXTREME_SQUEEZE
    return {
      signal_key: 'BB_EXTREME_SQUEEZE',
      params: {},
      text: getLogText(template, lang),
      type: template.type,
      timestamp: new Date().toISOString()
    }
  }

  if (currentWidthLevel === 6 && prevWidthLevel !== 6) {
    const template = LOG_TEMPLATES.BB.STRONG_EXPANSION
    return {
      signal_key: 'BB_STRONG_EXPANSION',
      params: {},
      text: getLogText(template, lang),
      type: template.type,
      timestamp: new Date().toISOString()
    }
  }

  // Position changes (if position data provided)
  if (position && prevPosition) {
    const currentPosLevel = getBBPositionLevel(position.price, position.upper, position.middle, position.lower)
    const prevPosLevel = getBBPositionLevel(prevPosition.price, prevPosition.upper, prevPosition.middle, prevPosition.lower)

    // Upper band breakout
    if (currentPosLevel === 5 && prevPosLevel !== 5) {
      const template = LOG_TEMPLATES.BB.BREAK_UPPER
      return {
        signal_key: 'BB_BREAK_UPPER',
        params: {},
        text: getLogText(template, lang),
        type: template.type,
        timestamp: new Date().toISOString()
      }
    }

    // Lower band breakout
    if (currentPosLevel === 1 && prevPosLevel !== 1) {
      const template = LOG_TEMPLATES.BB.BREAK_LOWER
      return {
        signal_key: 'BB_BREAK_LOWER',
        params: {},
        text: getLogText(template, lang),
        type: template.type,
        timestamp: new Date().toISOString()
      }
    }

    // Walking patterns (staying at upper/lower for extended time)
    // Note: Walking detection requires time-series data, so we detect simple position persistence
    // This is a simplified version - full implementation would track duration
  }

  return null
}

/**
 * Calculate whale tier from amount in USD
 * @param {number} amountUSD - Amount in USD
 * @returns {number} Tier (1-7)
 */
function getWhaleTier(amountUSD) {
  if (amountUSD >= 1000000000) return 7  // $1B+
  if (amountUSD >= 500000000) return 6   // $500M-$1B
  if (amountUSD >= 200000000) return 5   // $200M-$500M
  if (amountUSD >= 100000000) return 4   // $100M-$200M
  if (amountUSD >= 50000000) return 3    // $50M-$100M
  if (amountUSD >= 20000000) return 2    // $20M-$50M
  return 1                               // $10M-$20M
}

/**
 * Generate Whale transaction log
 * @param {object} whale - Whale event: {amount_usd, flow_type, ...}
 * @param {string} lang - Language code ('ko' or 'en')
 * @returns {object|null} Log object or null
 */
export function generateWhaleLog(whale, lang = 'ko') {
  if (!whale || !whale.amount_usd || !whale.flow_type) return null

  const tier = getWhaleTier(whale.amount_usd)
  const amountM = (whale.amount_usd / 1_000_000).toFixed(1) // Convert to millions
  const flowType = whale.flow_type.toUpperCase()

  // Legendary (Tier 7) special handling
  if (tier === 7) {
    const template = LOG_TEMPLATES.WHALE.LEGENDARY
    const params = { flow: flowType }
    const text = replacePlaceholders(getLogText(template, lang), params)
    return {
      signal_key: 'WHALE_LEGENDARY',
      params,
      text,
      type: template.type,
      timestamp: whale.timestamp || new Date().toISOString()
    }
  }

  // Flow type based templates
  const templateKey = flowType // BUY, SELL, EXCHANGE, INTERNAL, DEFI
  const template = LOG_TEMPLATES.WHALE[templateKey]

  if (!template) return null // Unknown flow type

  const params = { tier, amount: amountM }
  const text = replacePlaceholders(getLogText(template, lang), params)

  return {
    signal_key: `WHALE_${flowType}`,
    params,
    text,
    type: template.type,
    timestamp: whale.timestamp || new Date().toISOString()
  }
}

/**
 * Create log object with timestamp
 * @param {string} text - Log message
 * @param {string} type - Log type (danger/warning/info/success/default)
 * @returns {object} Log object
 */
export function createLog(text, type = 'info') {
  return {
    text,
    type,
    timestamp: new Date().toISOString()
  }
}
