import React, { useState } from 'react'
import Header from '../components/Header'
import TierCard from '../components/guide/TierCard'
import FlowTypeCard from '../components/guide/FlowTypeCard'
import IndicatorLevelTable from '../components/guide/IndicatorLevelTable'
import { whaleTiers, flowTypes } from '../data/whaleData'
import { rsiLevels } from '../data/rsiData'
import { macdLevels } from '../data/macdData'
import { bbWidthLevels, bbPositions } from '../data/bbData'

/**
 * GuidePage - 지표 가이드 및 설명
 * 4개 섹션: Whale, RSI, MACD, BB
 */
function GuidePage() {
  const [activeTab, setActiveTab] = useState('whale')

  const tabs = [
    { id: 'whale', name: '고래 티어', icon: '🐋' },
    { id: 'rsi', name: 'RSI', icon: '📈' },
    { id: 'macd', name: 'MACD', icon: '📉' },
    { id: 'bb', name: 'Bollinger Bands', icon: '📊' }
  ]

  return (
    <div className="min-h-screen bg-surface-100">
      <Header />

      <div className="max-w-[1280px] mx-auto p-6">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-600">📚 지표 가이드</h1>
          <p className="text-surface-500 mt-2">
            SubMarine의 4가지 핵심 지표를 이해하고 활용하세요
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6 border-b border-surface-300 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-surface-500 hover:text-surface-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="space-y-6">
          {/* 🐋 고래 티어 섹션 */}
          {activeTab === 'whale' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">고래 티어 시스템</h2>
                <p className="text-surface-500 mb-6">
                  $10M 이상의 대형 거래를 7단계 티어로 분류합니다. SubMarine만의 커스텀 리니어 시스템입니다.
                </p>
                <div className="grid gap-4">
                  {whaleTiers.map((tier) => (
                    <TierCard key={tier.tier} {...tier} />
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-bold text-surface-600 mb-4">Flow Type (거래 방향)</h2>
                <p className="text-surface-500 mb-6">
                  고래 거래의 방향성을 5가지로 분류하여 시장 영향을 파악합니다.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flowTypes.map((flow) => (
                    <FlowTypeCard key={flow.type} {...flow} />
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">💡 Tier 계산 공식</h3>
                  <div className="bg-surface-200 p-4 rounded font-mono text-sm space-y-2">
                    <div className="text-surface-600">
                      <span className="text-primary">// Custom tier assignment</span>
                    </div>
                    <div>if (amountUSD &gt;= 1000000000) return 7  <span className="text-surface-500">// $1B+</span></div>
                    <div>if (amountUSD &gt;= 500000000) return 6   <span className="text-surface-500">// $500M-$1B</span></div>
                    <div>if (amountUSD &gt;= 200000000) return 5   <span className="text-surface-500">// $200M-$500M</span></div>
                    <div>if (amountUSD &gt;= 100000000) return 4   <span className="text-surface-500">// $100M-$200M</span></div>
                    <div>if (amountUSD &gt;= 50000000) return 3    <span className="text-surface-500">// $50M-$100M</span></div>
                    <div>if (amountUSD &gt;= 20000000) return 2    <span className="text-surface-500">// $20M-$50M</span></div>
                    <div>return 1                                  <span className="text-surface-500">// $10M-$20M</span></div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 📈 RSI 섹션 */}
          {activeTab === 'rsi' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">RSI (Relative Strength Index)</h2>
                <p className="text-surface-500 mb-6">
                  상대강도지수. 0-100 범위를 10단계로 분류하여 과매수/과매도를 정밀하게 판단합니다.
                </p>
                <IndicatorLevelTable levels={rsiLevels} title="RSI 10단계 레벨 분류" />
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">📐 RSI 계산 공식</h3>
                  <div className="bg-surface-200 p-4 rounded font-mono text-sm space-y-2">
                    <div className="text-primary">Period: 14 (표준)</div>
                    <div className="text-primary">Values: 종가 기준</div>
                    <div className="mt-4 text-surface-600">
                      <div>RS = Average Gain (14) / Average Loss (14)</div>
                      <div className="mt-2">RSI = 100 - (100 / (1 + RS))</div>
                      <div className="mt-4 text-surface-500 text-xs">
                        • RSI = 100: 14일간 상승만 발생<br />
                        • RSI = 0: 14일간 하락만 발생<br />
                        • RSI = 50: 상승/하락 동일
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🔄 RSI 다이버전스</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-danger/10 border border-danger rounded-lg">
                      <h4 className="font-semibold text-danger mb-3">약세 다이버전스 (Bearish)</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        가격: 고점 상승 (Higher High)<br />
                        RSI: 고점 하락 (Lower High)
                      </p>
                      <p className="text-xs text-surface-500">
                        → 상승 추세 약화, 조정 임박
                      </p>
                    </div>
                    <div className="p-4 bg-success/10 border border-success rounded-lg">
                      <h4 className="font-semibold text-success mb-3">강세 다이버전스 (Bullish)</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        가격: 저점 하락 (Lower Low)<br />
                        RSI: 저점 상승 (Higher Low)
                      </p>
                      <p className="text-xs text-surface-500">
                        → 하락 추세 약화, 반등 임박
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 📉 MACD 섹션 */}
          {activeTab === 'macd' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">MACD (Moving Average Convergence Divergence)</h2>
                <p className="text-surface-500 mb-6">
                  이동평균 수렴확산 지수. Histogram 기준 7단계로 모멘텀 강도를 분류합니다.
                </p>
                <IndicatorLevelTable levels={macdLevels} title="MACD 7단계 레벨 분류" />
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">📐 MACD 계산 공식</h3>
                  <div className="bg-surface-200 p-4 rounded font-mono text-sm space-y-2">
                    <div className="text-primary">Fast Period: 12 (EMA)</div>
                    <div className="text-primary">Slow Period: 26 (EMA)</div>
                    <div className="text-primary">Signal Period: 9 (EMA)</div>
                    <div className="mt-4 text-surface-600">
                      <div>MACD Line = EMA(12) - EMA(26)</div>
                      <div className="mt-2">Signal Line = EMA(MACD Line, 9)</div>
                      <div className="mt-2 font-bold">Histogram = MACD Line - Signal Line</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">⚡ MACD 교차 신호</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-success/10 border border-success rounded-lg">
                      <h4 className="font-semibold text-success mb-3">골든크로스 (Golden Cross)</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        MACD Line &gt; Signal Line<br />
                        (Histogram &gt; 0)
                      </p>
                      <p className="text-xs text-surface-500">
                        → 매수 신호 (상승 모멘텀 시작)
                      </p>
                    </div>
                    <div className="p-4 bg-danger/10 border border-danger rounded-lg">
                      <h4 className="font-semibold text-danger mb-3">데드크로스 (Death Cross)</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        MACD Line &lt; Signal Line<br />
                        (Histogram &lt; 0)
                      </p>
                      <p className="text-xs text-surface-500">
                        → 매도 신호 (하락 모멘텀 시작)
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 📊 Bollinger Bands 섹션 */}
          {activeTab === 'bb' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">Bollinger Bands (볼린저 밴드)</h2>
                <p className="text-surface-500 mb-6">
                  변동성을 측정하는 지표. BB Width와 Price Position으로 시장 상태를 파악합니다.
                </p>

                <div className="space-y-6">
                  <IndicatorLevelTable levels={bbWidthLevels} title="BB Width 7단계 레벨" />
                  <IndicatorLevelTable levels={bbPositions} title="Price Position 5단계" />
                </div>
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">📐 BB 계산 공식</h3>
                  <div className="bg-surface-200 p-4 rounded font-mono text-sm space-y-2">
                    <div className="text-primary">Period: 20 (SMA)</div>
                    <div className="text-primary">Std Dev: 2</div>
                    <div className="mt-4 text-surface-600">
                      <div>BB_Middle = SMA(20)</div>
                      <div className="mt-2">BB_Upper = SMA(20) + (2 × StdDev)</div>
                      <div className="mt-2">BB_Lower = SMA(20) - (2 × StdDev)</div>
                      <div className="mt-4 font-bold text-primary">BB_Width% = (BB_Upper - BB_Lower) / BB_Middle × 100</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🎯 BB 패턴</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-3">Bollinger Squeeze</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        BB Width &lt; 2% (Level 1-2)
                      </p>
                      <p className="text-xs text-surface-500">
                        변동성 극도로 낮음 → 대형 움직임 직전<br />
                        브레이크아웃 방향 즉시 추종 권장
                      </p>
                    </div>
                    <div className="p-4 bg-danger/10 border border-danger rounded-lg">
                      <h4 className="font-semibold text-danger mb-3">Bollinger Expansion</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        BB Width &gt; 6% (Level 6-7)
                      </p>
                      <p className="text-xs text-surface-500">
                        변동성 급증 → 강한 트렌드<br />
                        트렌드 추종 전략 유효 (과열 경계)
                      </p>
                    </div>
                    <div className="p-4 bg-success/10 border border-success rounded-lg">
                      <h4 className="font-semibold text-success mb-3">상단 Walking</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        Price가 BB_Upper 근처 유지 (3일+)
                      </p>
                      <p className="text-xs text-surface-500">
                        강력한 상승 트렌드 지속<br />
                        초기: 진입, 후기: 손절가 타이트 관리
                      </p>
                    </div>
                    <div className="p-4 bg-danger/10 border border-danger rounded-lg">
                      <h4 className="font-semibold text-danger mb-3">하단 Walking</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        Price가 BB_Lower 근처 유지 (3일+)
                      </p>
                      <p className="text-xs text-surface-500">
                        강력한 하락 트렌드 지속<br />
                        초기: 진입, 후기: 손절가 타이트 관리
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GuidePage
