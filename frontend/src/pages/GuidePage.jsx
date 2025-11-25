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
    { id: 'bb', name: 'Bollinger Bands', icon: '📊' },
    { id: 'alerts', name: '알림 시스템', icon: '🚨' },
    { id: 'filters', name: '필터/설정', icon: '⚙️' },
    { id: 'trading', name: '트레이딩', icon: '💹' }
  ]

  return (
    <div className="min-h-screen bg-surface-100">
      <Header />

      <div className="max-w-[1280px] mx-auto p-6">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-600">📚 SubMarine 완전 가이드</h1>
          <p className="text-surface-500 mt-2">
            고래 추적부터 알림 시스템, 트레이딩 시뮬레이터까지 - 모든 기능 완벽 마스터
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
                <div className="card p-6 border-2 border-primary">
                  <h3 className="text-xl font-bold text-primary mb-4">⏱️ 시간 가중 분석 (2025-11-22 업데이트)</h3>

                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-500 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-blue-600 mb-3">🎯 왜 시간 가중이 필요한가?</h4>
                    <div className="text-sm text-surface-600 space-y-3">
                      <p className="font-medium text-red-600">
                        ❌ 문제: 과거 고래 Inflow + 현재 가격 하락 → 거짓 신호
                      </p>
                      <p className="text-surface-600">
                        12시간 전 고래가 대규모 Inflow(거래소→지갑)를 했지만, 지금은 가격이 하락 중이라면?
                        오래된 데이터가 현재 분석을 왜곡시킵니다.
                      </p>

                      <p className="font-medium text-success mt-4">
                        ✅ 해결: 최근 거래일수록 더 높은 가중치
                      </p>
                      <p className="text-surface-600">
                        1시간 전 거래는 85%, 6시간 전은 37%, 12시간 전은 14%만 반영합니다.
                        이렇게 하면 가격 변화와 고래 활동이 정확히 맞아떨어집니다.
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-surface-600 mb-3">📊 시간별 영향력</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-500 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-green-600">1시간 전</p>
                          <span className="text-xl font-bold text-green-600">85%</span>
                        </div>
                        <p className="text-sm text-surface-600">매우 높은 영향력 - 최근 고래 활동</p>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-600">6시간 전</p>
                          <span className="text-xl font-bold text-gray-600">37%</span>
                        </div>
                        <p className="text-sm text-surface-600">중간 영향력 - 어느 정도 참고</p>
                      </div>

                      <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-500 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-orange-600">12시간 전</p>
                          <span className="text-xl font-bold text-orange-600">14%</span>
                        </div>
                        <p className="text-sm text-surface-600">낮은 영향력 - 오래된 데이터</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-warning/10 border border-warning p-4 rounded-lg">
                    <h4 className="font-semibold text-warning mb-3">💡 실전 예시</h4>
                    <div className="text-sm text-surface-600 space-y-2">
                      <p className="font-medium">상황: BTC 가격이 지금 하락 중</p>
                      <ul className="space-y-1 ml-4">
                        <li>• 12시간 전: $200M Inflow (거래소→지갑, 상승 압력) → 14%만 반영 = <span className="text-success font-semibold">+$28M</span></li>
                        <li>• 2시간 전: $100M Outflow (지갑→거래소, 하락 압력) → 72% 반영 = <span className="text-danger font-semibold">-$72M</span></li>
                      </ul>
                      <p className="font-bold text-danger mt-2">
                        → 순 영향: +$28M - $72M = <span className="text-danger">-$44M</span> (하락 압력 우세!)
                      </p>
                      <p className="text-surface-500 text-xs mt-1">
                        과거 Inflow보다 최근 Outflow가 더 큰 영향을 미칩니다.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-primary/10 border border-primary rounded-lg">
                    <p className="text-sm text-surface-600">
                      <strong className="text-primary">📌 핵심:</strong> 시간 가중 분석은 고래 활동의
                      <strong className="text-primary">"모멘텀"</strong>을 정확히 포착합니다.
                      과거 데이터의 영향을 최소화하여 현재 시장 상황과
                      <strong className="text-primary">시간적으로 일치</strong>하는 분석을 제공합니다.
                    </p>
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

          {/* 🚨 알림 시스템 섹션 */}
          {activeTab === 'alerts' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">🚨 알림 시스템</h2>
                <p className="text-surface-500 mb-6">
                  12가지 핵심 알림 조합으로 시장의 모든 중요 순간을 포착합니다. S tier (가장 중요) → A tier (높음) → B tier (중간) 우선순위로 분류됩니다.
                </p>

                {/* S-Tier Alerts */}
                <div className="card p-6 mb-6 border-2 border-red-500">
                  <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-red-500/20 border border-red-500 rounded text-sm">S</span>
                    Critical Alerts (4개) - 즉시 대응 필요
                  </h3>

                  {/* S-01 */}
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">S-01: ABYSSAL SCOOP (심해 줍기)</h4>
                      <span className="px-2 py-1 bg-success text-white text-xs rounded font-bold">LONG</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      극단적 저점 + 대형 고래 매수 = 역사적 저가 매수 기회
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>RSI 극도로 낮음 (과매도 상태)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>고래 순매수 $30M 이상</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>큰 규모의 고래 참여 ($100M+)</span>
                      </div>
                    </div>
                  </div>

                  {/* S-02 */}
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">S-02: LEVIATHAN DUMP (리바이어던 투하)</h4>
                      <span className="px-2 py-1 bg-danger text-white text-xs rounded font-bold">SHORT</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      극단적 고점 + 대형 고래 매도 = 대형 하락 직전
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>RSI 극도로 높음 (과매수 상태)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>고래 순매도 $30M 이상</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>초대형 고래 참여 ($200M+)</span>
                      </div>
                    </div>
                  </div>

                  {/* S-03 */}
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">S-03: WHALE TORPEDO (고래 어뢰 발사)</h4>
                      <span className="px-2 py-1 bg-success text-white text-xs rounded font-bold">LONG</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      변동성 압축 → 상단 돌파 + 고래 매수 = 폭발적 상승
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>볼린저 밴드 극도로 좁음 (조용한 상태)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>가격이 상단 밴드 돌파</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>MACD 강한 상승 모멘텀 + 고래 매수 $20M+</span>
                      </div>
                    </div>
                  </div>

                  {/* S-04 */}
                  <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">S-04: HULL CRACK (선체 붕괴)</h4>
                      <span className="px-2 py-1 bg-danger text-white text-xs rounded font-bold">SHORT</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      변동성 압축 → 하단 돌파 + 고래 매도 = 급락 시작
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>볼린저 밴드 극도로 좁음</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>가격이 하단 밴드 돌파</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>MACD 강한 하락 모멘텀 + 고래 매도 $20M+</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* A-Tier Alerts */}
                <div className="card p-6 mb-6 border-2 border-orange-500">
                  <h3 className="text-xl font-bold text-orange-500 mb-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-orange-500/20 border border-orange-500 rounded text-sm">A</span>
                    High Priority Alerts (3개) - 높은 수익 가능성
                  </h3>

                  {/* A-01 */}
                  <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">A-01: SMART DIVERGENCE (스마트 다이버전스) ⭐</h4>
                      <span className="px-2 py-1 bg-success text-white text-xs rounded font-bold">LONG</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      가격 하락 중 고래는 매수 = 스마트 머니 축적 (시간 가중 분석 적용)
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>가격 하락 중 (최근 6시간 기준)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>고래 순매수 $30M 이상</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>초대형 고래 참여 ($200M+) + RSI 저점권</span>
                      </div>
                    </div>
                  </div>

                  {/* A-02 */}
                  <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">A-02: EXIT DIVERGENCE (출구 다이버전스)</h4>
                      <span className="px-2 py-1 bg-danger text-white text-xs rounded font-bold">SHORT</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      가격 상승 중 고래는 매도 = 스마트 머니 출구 전략
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>가격 상승 중 (최근 6시간 기준)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>고래 순매도 $30M 이상</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>초대형 고래 참여 ($200M+) + RSI 고점권</span>
                      </div>
                    </div>
                  </div>

                  {/* A-03 */}
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">A-03: FULL THROTTLE (전속력 상승)</h4>
                      <span className="px-2 py-1 bg-success text-white text-xs rounded font-bold">LONG</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      상단 밴드 워킹 + 강력한 MACD = 지속적 상승 트렌드
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>가격이 볼린저 밴드 상단 근처 유지</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>MACD 매우 강한 상승 모멘텀</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>RSI 강세 구간 (60-80)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B-Tier Alerts */}
                <div className="card p-6 mb-6 border-2 border-yellow-500">
                  <h3 className="text-xl font-bold text-yellow-600 mb-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500 rounded text-sm">B</span>
                    Medium Priority Alerts (3개) - 참고용
                  </h3>

                  {/* B-01 */}
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">B-01: BB SQUEEZE (볼린저 스퀴즈)</h4>
                      <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded font-bold">대기</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      변동성 극도로 낮음 = 큰 움직임 직전 신호, 방향 확인 후 진입
                    </p>
                  </div>

                  {/* B-02 */}
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">B-02: RSI OVERBOUGHT (RSI 과매수)</h4>
                      <span className="px-2 py-1 bg-danger text-white text-xs rounded font-bold">경계</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      RSI 과열 상태 = 조정 가능성, 롱 포지션 익절 고려
                    </p>
                  </div>

                  {/* B-03 */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">B-03: MACD GOLDEN CROSS (MACD 골든크로스)</h4>
                      <span className="px-2 py-1 bg-success text-white text-xs rounded font-bold">LONG</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      MACD 상승 전환 = 상승 모멘텀 시작, 다른 지표와 함께 확인
                    </p>
                  </div>
                </div>

                {/* Sound System */}
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🔊 사운드 시스템</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded">
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded font-bold">S</span>
                      <span className="text-surface-600">Critical 사운드 (T7 고래 소리) - 즉시 확인 필요</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded">
                      <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded font-bold">A</span>
                      <span className="text-surface-600">High Priority 사운드 (T5-T6 고래 소리)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded">
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded font-bold">B</span>
                      <span className="text-surface-600">Medium 사운드 (T3-T4 고래 소리)</span>
                    </div>
                    <p className="text-surface-500 mt-4">
                      💡 음소거 버튼은 메인 페이지 상단 필터 바에 있습니다. 설정은 자동 저장됩니다.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ⚙️ 필터/설정 섹션 */}
          {activeTab === 'filters' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">⚙️ 필터 & 설정</h2>
                <p className="text-surface-500 mb-6">
                  타임프레임, 심볼 선택, 그리고 숨겨진 개발자 도구까지 - 모든 설정 완벽 가이드
                </p>

                {/* Timeframe */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">⏱️ 타임프레임 선택</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">1h (1시간)</h4>
                      <p className="text-sm text-surface-600">
                        단기 트레이딩, 데이 트레이딩<br />
                        고래 수명: 3시간<br />
                        지표 민감도: 높음 (변동성 큼)
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">4h (4시간)</h4>
                      <p className="text-sm text-surface-600">
                        스윙 트레이딩<br />
                        고래 수명: 12시간<br />
                        지표 민감도: 중간 (균형)
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">8h (8시간)</h4>
                      <p className="text-sm text-surface-600">
                        포지션 트레이딩<br />
                        고래 수명: 24시간<br />
                        지표 민감도: 낮음 (안정적)
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">1d (1일)</h4>
                      <p className="text-sm text-surface-600">
                        장기 트렌드 분석<br />
                        고래 수명: 30일<br />
                        지표 민감도: 매우 낮음 (큰 흐름)
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-500 p-4 rounded text-sm">
                    <p className="font-bold text-blue-600 mb-2">💡 타임프레임 선택 팁</p>
                    <p className="text-surface-600">
                      • 짧은 타임프레임 = 더 많은 신호, 노이즈도 많음<br />
                      • 긴 타임프레임 = 적은 신호, 하지만 신뢰도 높음<br />
                      • 추천: 4h 타임프레임으로 시작 (중간 균형)
                    </p>
                  </div>
                </div>

                {/* Symbol Filter */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🪙 심볼 필터</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded">
                      <h4 className="font-semibold text-gray-600 mb-1">BTC</h4>
                      <p className="text-xs text-surface-500">비트코인 전용</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded">
                      <h4 className="font-semibold text-gray-600 mb-1">ETH</h4>
                      <p className="text-xs text-surface-500">이더리움 전용</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded">
                      <h4 className="font-semibold text-gray-600 mb-1">BNB</h4>
                      <p className="text-xs text-surface-500">바이낸스 코인</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded">
                      <h4 className="font-semibold text-gray-600 mb-1">SOL</h4>
                      <p className="text-xs text-surface-500">솔라나</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded">
                      <h4 className="font-semibold text-gray-600 mb-1">XRP</h4>
                      <p className="text-xs text-surface-500">리플</p>
                    </div>
                    <div className="p-3 bg-primary/20 border-2 border-primary rounded">
                      <h4 className="font-semibold text-primary mb-1">통합 (ALL)</h4>
                      <p className="text-xs text-surface-600">모든 코인 통합</p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 p-4 rounded text-sm">
                    <p className="font-bold text-yellow-600 mb-2">⚠️ 심볼 필터 주의사항</p>
                    <p className="text-surface-600">
                      • <strong>개별 심볼</strong>: 해당 코인만의 고래 활동 추적<br />
                      • <strong>통합 (ALL)</strong>: 전체 암호화폐 시장 고래 활동 통합<br />
                      • 통합 모드는 시장 전체 감정을 파악할 때 유용<br />
                      • 특정 코인 트레이딩 시에는 개별 심볼 선택 권장
                    </p>
                  </div>
                </div>

                {/* Mute Toggle */}
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🔇 음소거 설정</h3>
                  <p className="text-sm text-surface-600 mb-4">
                    메인 페이지 상단 필터 바에서 <strong>🔊/🔇 버튼</strong>으로 알림 사운드를 끄고 켤 수 있습니다.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-sm">
                    <p className="text-surface-600">
                      • 설정은 브라우저 localStorage에 자동 저장됩니다<br />
                      • 음소거해도 알림은 계속 화면에 표시됩니다<br />
                      • 사운드만 차단되며 기능은 정상 작동합니다
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 💹 트레이딩 섹션 */}
          {activeTab === 'trading' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">💹 트레이딩 시뮬레이터</h2>
                <p className="text-surface-500 mb-6">
                  실제 Binance 데이터로 가상 거래를 연습하세요. 실제 돈은 사용되지 않습니다!
                </p>

                {/* Warning */}
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 p-6 rounded-lg mb-6">
                  <h3 className="text-xl font-bold text-red-600 mb-3 flex items-center gap-2">
                    ⚠️ 중요: 이것은 시뮬레이터입니다
                  </h3>
                  <ul className="space-y-2 text-sm text-red-700 dark:text-red-400">
                    <li>✓ 실제 돈이 아닌 <strong>가상 USDT</strong>를 사용합니다</li>
                    <li>✓ 실제 거래소와 <strong>연결되지 않습니다</strong></li>
                    <li>✓ 손실/수익 모두 <strong>가상</strong>입니다</li>
                    <li>✓ 연습용으로만 사용하세요</li>
                    <li>✓ 실전 거래 시 다른 전략이 필요할 수 있습니다</li>
                  </ul>
                </div>

                {/* Overview */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🎯 트레이딩 시뮬레이터 개요</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-500 rounded">
                      <h4 className="font-semibold text-green-600 mb-2">✓ 제공되는 기능</h4>
                      <ul className="text-sm text-surface-600 space-y-1">
                        <li>• 실시간 Binance 가격 데이터</li>
                        <li>• Market / Limit 주문</li>
                        <li>• Long / Short 포지션</li>
                        <li>• 1-125x 레버리지</li>
                        <li>• 실시간 손익 계산</li>
                        <li>• 사용자 랭킹 시스템</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded">
                      <h4 className="font-semibold text-red-600 mb-2">✗ 제공되지 않는 기능</h4>
                      <ul className="text-sm text-surface-600 space-y-1">
                        <li>• 실제 돈 입출금</li>
                        <li>• 실제 거래소 연결</li>
                        <li>• 슬리피지 시뮬레이션</li>
                        <li>• 펀딩 비용</li>
                        <li>• 실제 주문 체결 지연</li>
                        <li>• 청산 시뮬레이션</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* How to Trade */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">📖 거래 방법</h3>

                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">1️⃣ 로그인 필수</h4>
                      <p className="text-sm text-surface-600">
                        트레이딩 페이지에서 <strong>로그인 버튼</strong>을 클릭하여 계정을 만드세요. <br />
                        초기 잔액: <strong>10,000 USDT</strong> (가상)
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">2️⃣ 차트 확인</h4>
                      <p className="text-sm text-surface-600">
                        왼쪽 차트에서 BTC/USDT 실시간 가격을 확인하세요.<br />
                        인터벌 선택: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d<br />
                        <span className="text-success font-semibold">초록색 캔들 = 상승</span>, <span className="text-danger font-semibold">빨간색 캔들 = 하락</span>
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">3️⃣ 주문 유형 선택</h4>
                      <div className="grid md:grid-cols-2 gap-3 mt-2">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded">
                          <p className="font-semibold text-surface-600 mb-1">Market (시장가)</p>
                          <p className="text-xs text-surface-500">현재 가격에 즉시 체결</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded">
                          <p className="font-semibold text-surface-600 mb-1">Limit (지정가)</p>
                          <p className="text-xs text-surface-500">원하는 가격에 주문 대기</p>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">4️⃣ Long / Short 선택</h4>
                      <div className="grid md:grid-cols-2 gap-3 mt-2">
                        <div className="p-3 bg-success/10 border border-success rounded">
                          <p className="font-semibold text-success mb-1">Long (매수)</p>
                          <p className="text-xs text-surface-600">
                            가격이 <strong>상승</strong>할 것으로 예상<br />
                            예: $80,000 → $85,000 (+$5,000 수익)
                          </p>
                        </div>
                        <div className="p-3 bg-danger/10 border border-danger rounded">
                          <p className="font-semibold text-danger mb-1">Short (매도)</p>
                          <p className="text-xs text-surface-600">
                            가격이 <strong>하락</strong>할 것으로 예상<br />
                            예: $80,000 → $75,000 (+$5,000 수익)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">5️⃣ 레버리지 설정 (1-125x)</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        슬라이더로 레버리지를 조절하세요. <strong>레버리지가 높을수록 수익도 크지만 손실도 큽니다!</strong>
                      </p>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded text-xs">
                        <p className="font-semibold mb-1">레버리지 예시:</p>
                        <p className="text-surface-600">
                          • 1x: 100 USDT → 100 USDT 포지션 (가격 1% 상승 = 1 USDT 수익)<br />
                          • 10x: 100 USDT → 1,000 USDT 포지션 (가격 1% 상승 = 10 USDT 수익)<br />
                          • 100x: 100 USDT → 10,000 USDT 포지션 (가격 1% 상승 = 100 USDT 수익)
                        </p>
                      </div>
                    </div>

                    {/* Step 6 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">6️⃣ 수량 입력</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        거래할 BTC 수량을 입력하세요. 하단 슬라이더로 보유 자산의 25% / 50% / 75% / 100% 선택 가능합니다.
                      </p>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 p-3 rounded text-xs">
                        <p className="font-semibold text-yellow-600 mb-1">⚠️ Max Buy 계산식:</p>
                        <p className="text-surface-600">
                          Max Buy = (잔액 × 레버리지) / 현재 가격<br />
                          예: 1,000 USDT × 10x / $80,000 = 0.125 BTC
                        </p>
                      </div>
                    </div>

                    {/* Step 7 */}
                    <div className="p-4 bg-success/10 border border-success rounded-lg">
                      <h4 className="font-semibold text-success mb-2">7️⃣ 주문 실행</h4>
                      <p className="text-sm text-surface-600">
                        <strong>Long</strong> 또는 <strong>Short</strong> 버튼을 클릭하여 주문을 실행하세요.<br />
                        Market 주문은 즉시 체결되며, Limit 주문은 Orders 탭에 대기합니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Position Management */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">📊 포지션 관리</h3>

                  <div className="space-y-4">
                    {/* Positions Tab */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-500 rounded">
                      <h4 className="font-semibold text-blue-600 mb-2">포지션 (Positions)</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        현재 보유 중인 포지션 목록 표시
                      </p>
                      <ul className="text-xs text-surface-600 space-y-1">
                        <li>• <strong>Entry Price</strong>: 진입 가격</li>
                        <li>• <strong>Current Price</strong>: 현재 가격 (실시간 업데이트)</li>
                        <li>• <strong>Size</strong>: 포지션 크기 (BTC)</li>
                        <li>• <strong>Leverage</strong>: 사용 레버리지</li>
                        <li>• <strong>PnL</strong>: 손익 (Profit and Loss) - 실시간 계산</li>
                        <li>• <strong>Close</strong>: 포지션 청산 버튼</li>
                      </ul>
                    </div>

                    {/* Orders Tab */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-500 rounded">
                      <h4 className="font-semibold text-green-600 mb-2">주문 (Orders)</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        대기 중인 Limit 주문 목록 표시
                      </p>
                      <ul className="text-xs text-surface-600 space-y-1">
                        <li>• 가격이 지정가에 도달하면 자동 체결</li>
                        <li>• Cancel 버튼으로 주문 취소 가능</li>
                        <li>• Market 주문은 즉시 체결되므로 여기 표시 안 됨</li>
                      </ul>
                    </div>

                    {/* History Tab */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-500 rounded">
                      <h4 className="font-semibold text-purple-600 mb-2">히스토리 (History)</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        과거 거래 내역 및 손익 기록
                      </p>
                      <ul className="text-xs text-surface-600 space-y-1">
                        <li>• 모든 청산된 포지션의 기록</li>
                        <li>• 손익 누적 확인 가능</li>
                        <li>• 거래 패턴 분석에 활용</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 p-4 rounded text-sm mt-4">
                    <p className="font-bold text-yellow-600 mb-2">💡 손익 계산 방식</p>
                    <div className="text-surface-600 space-y-2 text-sm">
                      <p><strong>롱(매수)</strong>: 가격이 올라가면 수익, 내려가면 손실</p>
                      <p><strong>숏(매도)</strong>: 가격이 내려가면 수익, 올라가면 손실</p>
                      <p className="text-xs text-surface-500">※ 레버리지가 높을수록 손익 변동폭이 커집니다</p>
                    </div>
                  </div>
                </div>

                {/* Ranking */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🏆 랭킹 시스템</h3>
                  <p className="text-sm text-surface-600 mb-4">
                    다른 사용자와 수익률을 겨루세요! 상위 랭커가 되어보세요.
                  </p>
                  <div className="bg-primary/10 border border-primary p-4 rounded">
                    <p className="text-sm text-surface-600">
                      • 총 수익 (Total Profit) 기준 순위<br />
                      • 실시간 Supabase 동기화<br />
                      • 닉네임 변경 가능<br />
                      • 상위 50명 리더보드 표시
                    </p>
                  </div>
                </div>

                {/* Risk Warning */}
                <div className="card p-6 border-2 border-red-500">
                  <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ 위험 경고</h3>
                  <div className="space-y-3 text-sm text-surface-600">
                    <p>
                      <strong className="text-red-600">1. 이것은 시뮬레이터입니다</strong><br />
                      실제 거래소와 완전히 다릅니다. 실전에서는 슬리피지, 수수료, 펀딩 비용, 청산 위험이 있습니다.
                    </p>
                    <p>
                      <strong className="text-red-600">2. 레버리지 위험</strong><br />
                      높은 레버리지는 손실도 증폭시킵니다. 실전에서 고레버리지 사용 시 즉시 청산될 수 있습니다.
                    </p>
                    <p>
                      <strong className="text-red-600">3. 연습용으로만 사용하세요</strong><br />
                      시뮬레이터에서 수익이 나도 실전에서 같은 결과를 보장하지 않습니다. 실전 거래 전 충분한 학습이 필요합니다.
                    </p>
                    <p>
                      <strong className="text-red-600">4. 투자 권유 아님</strong><br />
                      이 도구는 교육 목적으로 제공됩니다. 투자 결정은 본인의 책임입니다.
                    </p>
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
