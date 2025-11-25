/**
 * SubMarine Indicator Log Templates (Strict ver.)
 * 문서 [SubMarine 지표 분류 시스템] 기준 100% 일치 버전
 * Bilingual support: Korean (ko) and English (en)
 *
 * [Placeholders]
 * {level}: 단계 (L1 ~ L10)
 * {val}: 실제 수치 (예: 82.5, +150.2)
 * {prev}: 이전 상태
 * {curr}: 현재 상태
 * {tier}: 고래 등급 (T1 ~ T7)
 * {amount}: 금액 ($M 단위)
 * {flow}: 자금 이동 성격 (Buy/Sell/Exchange...)
 */

export const LOG_TEMPLATES = {
  // =================================================================
  // 📊 1. RSI (Relative Strength Index) - 10 Level System
  // =================================================================
  RSI: {
    // [L10] 극강 과매수 (90-100)
    LEVEL_10: {
      ko: "⚠️ [RSI L10] 극단적 과매수(RSI {val}). 시장 광기 상태. 조정 확률 85%+",
      en: "⚠️ [RSI L10] Extreme overbought (RSI {val}). Market euphoria. 85%+ correction probability",
      type: "danger"
    },
    // [L9] 매우 과매수 (80-90)
    LEVEL_9: {
      ko: "🚨 [RSI L9] 강한 과매수(RSI {val}). 조정 임박, 분할 익절 구간.",
      en: "🚨 [RSI L9] Strong overbought (RSI {val}). Correction imminent, take partial profits.",
      type: "warning"
    },
    // [L8] 과매수 (70-80)
    LEVEL_8: {
      ko: "🔥 [RSI L8] 과매수 진입(RSI {val}). 강한 상승 추세.",
      en: "🔥 [RSI L8] Entering overbought (RSI {val}). Strong uptrend.",
      type: "warning"
    },

    // [L7] 강세 (60-70)
    LEVEL_7: {
      ko: "📈 [RSI L7] 건강한 상승 추세(Bullish)가 지속 중입니다.",
      en: "📈 [RSI L7] Healthy bullish trend continues.",
      type: "success"
    },
    // [L4] 약세 (30-40)
    LEVEL_4: {
      ko: "📉 [RSI L4] 하락 추세(Bearish)가 지속 중입니다.",
      en: "📉 [RSI L4] Bearish trend continues.",
      type: "info"
    },

    // [L3] 과매도 (20-30)
    LEVEL_3: {
      ko: "♻️ [RSI L3] 과매도 진입(RSI {val}). 기술적 반등 고려 구간.",
      en: "♻️ [RSI L3] Entering oversold (RSI {val}). Technical bounce zone.",
      type: "info"
    },
    // [L2] 매우 과매도 (10-20)
    LEVEL_2: {
      ko: "🌊 [RSI L2] 강한 과매도(RSI {val}). 반등 임박.",
      en: "🌊 [RSI L2] Strong oversold (RSI {val}). Bounce imminent.",
      type: "success"
    },
    // [L1] 극강 과매도 (0-10)
    LEVEL_1: {
      ko: "💎 [RSI L1] 극단적 과매도(RSI {val}). 시장 공포 상태. 바닥 근접.",
      en: "💎 [RSI L1] Extreme oversold (RSI {val}). Market fear. Near bottom.",
      type: "success"
    },

    // [Cross] 중립선 교차
    CROSS_UP_50: {
      ko: "↗️ RSI가 중립선(50)을 상향 돌파했습니다. (매수 우위 전환)",
      en: "↗️ RSI crossed above 50 (neutral line). Buyers taking control.",
      type: "success"
    },
    CROSS_DOWN_50: {
      ko: "↘️ RSI가 중립선(50)을 하향 이탈했습니다. (매도 우위 전환)",
      en: "↘️ RSI crossed below 50 (neutral line). Sellers taking control.",
      type: "danger"
    }
  },

  // =================================================================
  // 📉 2. MACD - 7 Level System
  // =================================================================
  MACD: {
    // [Signal] 교차 신호
    GOLDEN_CROSS: {
      ko: "📈 [MACD] 골든크로스 발생. 단기 상승 모멘텀 시작.",
      en: "📈 [MACD] Golden Cross detected. Short-term bullish momentum begins.",
      type: "success"
    },
    DEATH_CROSS: {
      ko: "📉 [MACD] 데드크로스 발생. 단기 하락 모멘텀 시작.",
      en: "📉 [MACD] Death Cross detected. Short-term bearish momentum begins.",
      type: "danger"
    },

    // [Zero Line] 추세 전환
    ZERO_CROSS_UP: {
      ko: "🆙 MACD 0선 상향 돌파. 강세장(Bull Market) 진입 신호.",
      en: "🆙 MACD crossed above zero line. Bull Market entry signal.",
      type: "success"
    },
    ZERO_CROSS_DOWN: {
      ko: "⬇️ MACD 0선 하향 이탈. 약세장(Bear Market) 진입 신호.",
      en: "⬇️ MACD crossed below zero line. Bear Market entry signal.",
      type: "danger"
    },

    // [Histogram] 모멘텀 강도 (L5~L7 / L1~L3)
    EXTREME_BULLISH: {
      ko: "🔥 [MACD L7] 극강 강세 모멘텀. 매수세 폭발.",
      en: "🔥 [MACD L7] Extreme bullish momentum. Buying pressure exploding.",
      type: "warning"
    },
    EXTREME_BEARISH: {
      ko: "❄️ [MACD L1] 극강 약세 모멘텀. 매도세 폭발.",
      en: "❄️ [MACD L1] Extreme bearish momentum. Selling pressure exploding.",
      type: "info"
    }
  },

  // =================================================================
  // ⚡ 3. Bollinger Bands - Width 7단계 + Position 5단계
  // =================================================================
  BB: {
    // [Width] 변동성 상태
    EXTREME_SQUEEZE: {
      ko: "⚡️ [BB Width L1] 극강 수축(Extreme Squeeze). 대형 변동성 폭발 직전.",
      en: "⚡️ [BB Width L1] Extreme Squeeze. Major volatility explosion imminent.",
      type: "info"
    },
    STRONG_EXPANSION: {
      ko: "💥 [BB Width L6] 강한 확장(Expansion). 트렌드 가속화.",
      en: "💥 [BB Width L6] Strong Expansion. Trend accelerating.",
      type: "warning"
    },

    // [Position] 가격 위치
    BREAK_UPPER: {
      ko: "🚀 [BB L5] 가격이 밴드 상단을 돌파했습니다. 강한 상승세.",
      en: "🚀 [BB L5] Price broke above upper band. Strong uptrend.",
      type: "danger"
    },
    BREAK_LOWER: {
      ko: "💧 [BB L1] 가격이 밴드 하단을 이탈했습니다. 강한 하락세.",
      en: "💧 [BB L1] Price broke below lower band. Strong downtrend.",
      type: "success"
    },
    WALKING_UPPER: {
      ko: "📈 [BB Walking] 밴드 상단을 타고 상승 중입니다. (초강세)",
      en: "📈 [BB Walking] Walking the upper band. (Super bullish)",
      type: "success"
    },
    WALKING_LOWER: {
      ko: "📉 [BB Walking] 밴드 하단을 타고 하락 중입니다. (초약세)",
      en: "📉 [BB Walking] Walking the lower band. (Super bearish)",
      type: "danger"
    }
  },

  // =================================================================
  // 🐋 4. Whale - 7 Tier & 5 Flow Types
  // =================================================================
  WHALE: {
    // Flow Type 1: 유입 (Exchange -> Wallet)
    INFLOW: {
      ko: "🟢 [Whale Inflow] Tier {tier} 고래가 ${amount}M 유입했습니다.",
      en: "🟢 [Whale Inflow] Tier {tier} whale withdrew ${amount}M from exchange.",
      type: "success"
    },
    // Flow Type 2: 유출 (Wallet -> Exchange)
    OUTFLOW: {
      ko: "🔴 [Whale Outflow] Tier {tier} 고래가 ${amount}M 유출(입금)했습니다.",
      en: "🔴 [Whale Outflow] Tier {tier} whale deposited ${amount}M to exchange.",
      type: "danger"
    },
    // Flow Type 3: 거래소 간 이동
    EXCHANGE: {
      ko: "⚪ [Whale Move] Tier {tier} 고래가 거래소 간 ${amount}M 이동했습니다.",
      en: "⚪ [Whale Move] Tier {tier} whale moved ${amount}M between exchanges.",
      type: "default"
    },
    // Flow Type 4: 지갑 간 이동
    INTERNAL: {
      ko: "⚪ [Whale Move] Tier {tier} 지갑 간 ${amount}M 이동했습니다.",
      en: "⚪ [Whale Move] Tier {tier} moved ${amount}M between wallets.",
      type: "default"
    },
    // Flow Type 5: DeFi/Contract
    DEFI: {
      ko: "🟡 [Whale DeFi] Tier {tier} 고래가 DeFi/계약에 ${amount}M 사용했습니다.",
      en: "🟡 [Whale DeFi] Tier {tier} whale used ${amount}M in DeFi/contract.",
      type: "warning"
    },

    // Special: 레전더리 (Tier 7)
    LEGENDARY: {
      ko: "🚨 [LEGENDARY] Tier 7 초대형 고래($1B+)가 움직였습니다! ({flow})",
      en: "🚨 [LEGENDARY] Tier 7 mega whale ($1B+) has moved! ({flow})",
      type: "warning"
    }
  },

  // =================================================================
  // 📊 5. Volume (Market Fuel) - 거래량 상태
  // =================================================================
  VOLUME: {
    // [L4] 폭발 (Explosive) - 200% 이상
    EXPLOSIVE: {
      ko: "🌋 [VOL L4] 거래량 폭발(평소의 {val}배)! 강력한 변동성 동반.",
      en: "🌋 [VOL L4] Volume explosion ({val}x normal)! Strong volatility ahead.",
      type: "warning"
    },
    // [L3] 활성 (Active) - 120% 이상
    ACTIVE: {
      ko: "🌊 [VOL L3] 거래량 증가(Active). 추세 형성 시도 중.",
      en: "🌊 [VOL L3] Volume increasing (Active). Trend forming.",
      type: "success"
    },
    // [L2] 정상 (Normal) - 80-120%
    NORMAL: {
      ko: "📊 [VOL L2] 거래량 정상 범위.",
      en: "📊 [VOL L2] Volume in normal range.",
      type: "info"
    },
    // [L1] 침묵 (Calm) - 80% 미만
    CALM: {
      ko: "🤫 [VOL L1] 거래량 감소(Calm). 폭풍전야 상태.",
      en: "🤫 [VOL L1] Volume decreasing (Calm). Calm before the storm.",
      type: "info"
    },
    // [Special] 갑작스러운 스파이크 (이전 캔들 대비 3배 이상)
    SPIKE: {
      ko: "⚡ [VOL SPIKE] 순간 거래량 급증 감지! 세력 개입 가능성.",
      en: "⚡ [VOL SPIKE] Sudden volume spike detected! Possible whale activity.",
      type: "warning"
    }
  }
};

/**
 * Get log text by language
 * @param {object} template - Template object with ko/en keys
 * @param {string} lang - Language code ('ko' or 'en')
 * @returns {string} Text in requested language
 */
export function getLogText(template, lang = 'ko') {
  if (!template) return '';
  // Support both old format (text) and new format (ko/en)
  if (template.text) return template.text;
  return lang === 'en' ? (template.en || template.ko) : template.ko;
}