/**
 * SubMarine Indicator Log Templates (Strict ver.)
 * 문서 [SubMarine 지표 분류 시스템] 기준 100% 일치 버전
 * * [Placeholders]
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
      text: "⚠️ [RSI L10] 극단적 과매수(RSI {val}). 시장 광기 상태. 조정 확률 85%+",
      type: "danger"
    },
    // [L9] 매우 과매수 (80-90)
    LEVEL_9: {
      text: "🚨 [RSI L9] 강한 과매수(RSI {val}). 조정 임박, 분할 익절 구간.",
      type: "warning"
    },
    // [L8] 과매수 (70-80)
    LEVEL_8: {
      text: "🔥 [RSI L8] 과매수 진입(RSI {val}). 강한 상승 추세.",
      type: "warning"
    },
    
    // [L7] 강세 (60-70)
    LEVEL_7: {
      text: "📈 [RSI L7] 건강한 상승 추세(Bullish)가 지속 중입니다.",
      type: "success"
    },
    // [L4] 약세 (30-40)
    LEVEL_4: {
      text: "📉 [RSI L4] 하락 추세(Bearish)가 지속 중입니다.",
      type: "info"
    },

    // [L3] 과매도 (20-30)
    LEVEL_3: {
      text: "♻️ [RSI L3] 과매도 진입(RSI {val}). 기술적 반등 고려 구간.",
      type: "info"
    },
    // [L2] 매우 과매도 (10-20)
    LEVEL_2: {
      text: "🌊 [RSI L2] 강한 과매도(RSI {val}). 반등 임박.",
      type: "success"
    },
    // [L1] 극강 과매도 (0-10)
    LEVEL_1: {
      text: "💎 [RSI L1] 극단적 과매도(RSI {val}). 시장 공포 상태. 바닥 근접.",
      type: "success"
    },

    // [Cross] 중립선 교차
    CROSS_UP_50: {
      text: "↗️ RSI가 중립선(50)을 상향 돌파했습니다. (매수 우위 전환)",
      type: "success"
    },
    CROSS_DOWN_50: {
      text: "↘️ RSI가 중립선(50)을 하향 이탈했습니다. (매도 우위 전환)",
      type: "danger"
    }
  },

  // =================================================================
  // 📉 2. MACD - 7 Level System
  // =================================================================
  MACD: {
    // [Signal] 교차 신호
    GOLDEN_CROSS: {
      text: "📈 [MACD] 골든크로스 발생. 단기 상승 모멘텀 시작.",
      type: "success"
    },
    DEATH_CROSS: {
      text: "📉 [MACD] 데드크로스 발생. 단기 하락 모멘텀 시작.",
      type: "danger"
    },

    // [Zero Line] 추세 전환
    ZERO_CROSS_UP: {
      text: "🆙 MACD 0선 상향 돌파. 강세장(Bull Market) 진입 신호.",
      type: "success"
    },
    ZERO_CROSS_DOWN: {
      text: "⬇️ MACD 0선 하향 이탈. 약세장(Bear Market) 진입 신호.",
      type: "danger"
    },

    // [Histogram] 모멘텀 강도 (L5~L7 / L1~L3)
    EXTREME_BULLISH: {
      text: "🔥 [MACD L7] 극강 강세 모멘텀. 매수세 폭발.",
      type: "warning"
    },
    EXTREME_BEARISH: {
      text: "❄️ [MACD L1] 극강 약세 모멘텀. 매도세 폭발.",
      type: "info"
    }
  },

  // =================================================================
  // ⚡ 3. Bollinger Bands - Width 7단계 + Position 5단계
  // =================================================================
  BB: {
    // [Width] 변동성 상태
    EXTREME_SQUEEZE: {
      text: "⚡️ [BB Width L1] 극강 수축(Extreme Squeeze). 대형 변동성 폭발 직전.",
      type: "info"
    },
    STRONG_EXPANSION: {
      text: "💥 [BB Width L6] 강한 확장(Expansion). 트렌드 가속화.",
      type: "warning"
    },

    // [Position] 가격 위치
    BREAK_UPPER: {
      text: "🚀 [BB L5] 가격이 밴드 상단을 돌파했습니다. 강한 상승세.",
      type: "danger"
    },
    BREAK_LOWER: {
      text: "💧 [BB L1] 가격이 밴드 하단을 이탈했습니다. 강한 하락세.",
      type: "success"
    },
    WALKING_UPPER: {
      text: "📈 [BB Walking] 밴드 상단을 타고 상승 중입니다. (초강세)",
      type: "success"
    },
    WALKING_LOWER: {
      text: "📉 [BB Walking] 밴드 하단을 타고 하락 중입니다. (초약세)",
      type: "danger"
    }
  },

  // =================================================================
  // 🐋 4. Whale - 7 Tier & 5 Flow Types
  // =================================================================
  WHALE: {
    // Flow Type 1: 유입 (Exchange -> Wallet)
    INFLOW: {
      text: "🟢 [Whale Inflow] Tier {tier} 고래가 ${amount}M 유입했습니다.",
      type: "success"
    },
    // Flow Type 2: 유출 (Wallet -> Exchange)
    OUTFLOW: {
      text: "🔴 [Whale Outflow] Tier {tier} 고래가 ${amount}M 유출(입금)했습니다.",
      type: "danger"
    },
    // Flow Type 3: 거래소 간 이동
    EXCHANGE: {
      text: "⚪ [Whale Move] Tier {tier} 고래가 거래소 간 ${amount}M 이동했습니다.",
      type: "default"
    },
    // Flow Type 4: 지갑 간 이동
    INTERNAL: {
      text: "⚪ [Whale Move] Tier {tier} 지갑 간 ${amount}M 이동했습니다.",
      type: "default"
    },
    // Flow Type 5: DeFi/Contract
    DEFI: {
      text: "🟡 [Whale DeFi] Tier {tier} 고래가 DeFi/계약에 ${amount}M 사용했습니다.",
      type: "warning"
    },

    // Special: 레전더리 (Tier 7)
    LEGENDARY: {
      text: "🚨 [LEGENDARY] Tier 7 초대형 고래($1B+)가 움직였습니다! ({flow})",
      type: "warning"
    }
  },

  // =================================================================
  // 📊 5. Volume (Market Fuel) - 거래량 상태
  // =================================================================
  VOLUME: {
    // [L4] 폭발 (Explosive) - 200% 이상
    EXPLOSIVE: {
      text: "🌋 [VOL L4] 거래량 폭발(평소의 {val}배)! 강력한 변동성 동반.",
      type: "warning"
    },
    // [L3] 활성 (Active) - 120% 이상
    ACTIVE: {
      text: "🌊 [VOL L3] 거래량 증가(Active). 추세 형성 시도 중.",
      type: "success"
    },
    // [L2] 정상 (Normal) - 80-120%
    NORMAL: {
      text: "📊 [VOL L2] 거래량 정상 범위.",
      type: "info"
    },
    // [L1] 침묵 (Calm) - 80% 미만
    CALM: {
      text: "🤫 [VOL L1] 거래량 감소(Calm). 폭풍전야 상태.",
      type: "info"
    },
    // [Special] 갑작스러운 스파이크 (이전 캔들 대비 3배 이상)
    SPIKE: {
      text: "⚡ [VOL SPIKE] 순간 거래량 급증 감지! 세력 개입 가능성.",
      type: "warning"
    }
  }
};