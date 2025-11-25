import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header'
import TierCard from '../components/guide/TierCard'
import FlowTypeCard from '../components/guide/FlowTypeCard'
import IndicatorLevelTable from '../components/guide/IndicatorLevelTable'
import { whaleTiers, flowTypes } from '../data/whaleData'
import { rsiLevels } from '../data/rsiData'
import { macdLevels } from '../data/macdData'
import { bbWidthLevels, bbPositions } from '../data/bbData'

/**
 * GuidePage - Indicator Guide and Documentation
 * 4 sections: Whale, RSI, MACD, BB
 */
function GuidePage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('whale')

  const tabs = [
    { id: 'whale', name: t('guide.tabs.whale'), icon: '🐋' },
    { id: 'rsi', name: t('guide.tabs.rsi'), icon: '📈' },
    { id: 'macd', name: t('guide.tabs.macd'), icon: '📉' },
    { id: 'bb', name: t('guide.tabs.bb'), icon: '📊' },
    { id: 'alerts', name: t('guide.tabs.alerts'), icon: '🚨' },
    { id: 'filters', name: t('guide.tabs.filters'), icon: '⚙️' },
    { id: 'trading', name: t('guide.tabs.trading'), icon: '💹' }
  ]

  return (
    <div className="min-h-screen bg-surface-100">
      <Header />

      <div className="max-w-[1280px] mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-600">{t('guide.pageTitle')}</h1>
          <p className="text-surface-500 mt-2">
            {t('guide.pageSubtitle')}
          </p>
        </div>

        {/* Tab Navigation */}
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

        {/* Tab Content */}
        <div className="space-y-6">
          {/* 🐋 Whale Tier Section */}
          {activeTab === 'whale' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">{t('guide.whale.tierTitle')}</h2>
                <p className="text-surface-500 mb-6">
                  {t('guide.whale.tierDesc')}
                </p>
                <div className="grid gap-4">
                  {whaleTiers.map((tier) => (
                    <TierCard key={tier.tier} {...tier} />
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-2xl font-bold text-surface-600 mb-4">{t('guide.whale.flowTitle')}</h2>
                <p className="text-surface-500 mb-6">
                  {t('guide.whale.flowDesc')}
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flowTypes.map((flow) => (
                    <FlowTypeCard key={flow.type} {...flow} />
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <div className="card p-6 border-2 border-primary">
                  <h3 className="text-xl font-bold text-primary mb-4">⏱️ {t('guide.whale.timeWeighted.title')}</h3>

                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-500 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-blue-600 mb-3">🎯 {t('guide.whale.timeWeighted.whyNeeded')}</h4>
                    <div className="text-sm text-surface-600 space-y-3">
                      <p className="font-medium text-red-600">
                        ❌ {t('guide.whale.timeWeighted.problem')}
                      </p>
                      <p className="text-surface-600">
                        {t('guide.whale.timeWeighted.problemDesc')}
                      </p>

                      <p className="font-medium text-success mt-4">
                        ✅ {t('guide.whale.timeWeighted.solution')}
                      </p>
                      <p className="text-surface-600">
                        {t('guide.whale.timeWeighted.solutionDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-surface-600 mb-3">📊 {t('guide.whale.timeWeighted.impactTitle')}</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-500 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-green-600">{t('guide.whale.timeWeighted.hour1')}</p>
                          <span className="text-xl font-bold text-green-600">{t('guide.whale.timeWeighted.hour1Pct')}</span>
                        </div>
                        <p className="text-sm text-surface-600">{t('guide.whale.timeWeighted.hour1Desc')}</p>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-600">{t('guide.whale.timeWeighted.hour6')}</p>
                          <span className="text-xl font-bold text-gray-600">{t('guide.whale.timeWeighted.hour6Pct')}</span>
                        </div>
                        <p className="text-sm text-surface-600">{t('guide.whale.timeWeighted.hour6Desc')}</p>
                      </div>

                      <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-500 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-orange-600">{t('guide.whale.timeWeighted.hour12')}</p>
                          <span className="text-xl font-bold text-orange-600">{t('guide.whale.timeWeighted.hour12Pct')}</span>
                        </div>
                        <p className="text-sm text-surface-600">{t('guide.whale.timeWeighted.hour12Desc')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-warning/10 border border-warning p-4 rounded-lg">
                    <h4 className="font-semibold text-warning mb-3">💡 {t('guide.whale.timeWeighted.example')}</h4>
                    <div className="text-sm text-surface-600 space-y-2">
                      <p className="font-medium">{t('guide.whale.timeWeighted.exampleSituation')}</p>
                      <ul className="space-y-1 ml-4">
                        <li>• {t('guide.whale.timeWeighted.exampleLine1')} <span className="text-success font-semibold">+$28M</span></li>
                        <li>• {t('guide.whale.timeWeighted.exampleLine2')} <span className="text-danger font-semibold">-$72M</span></li>
                      </ul>
                      <p className="font-bold text-danger mt-2">
                        {t('guide.whale.timeWeighted.exampleResult')} <span className="text-danger">-$44M</span>
                      </p>
                      <p className="text-surface-500 text-xs mt-1">
                        {t('guide.whale.timeWeighted.exampleNote')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-primary/10 border border-primary rounded-lg">
                    <p className="text-sm text-surface-600">
                      <strong className="text-primary">📌 {t('guide.whale.timeWeighted.keyPoint')}</strong> {t('guide.whale.timeWeighted.keyPointDesc')}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 📈 RSI Section */}
          {activeTab === 'rsi' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">{t('guide.rsi.title')}</h2>
                <p className="text-surface-500 mb-6">
                  {t('guide.rsi.desc')}
                </p>
                <IndicatorLevelTable levels={rsiLevels} title={t('guide.rsi.tableTitle')} />
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">📐 {t('guide.rsi.formulaTitle')}</h3>
                  <div className="bg-surface-200 p-4 rounded font-mono text-sm space-y-2">
                    <div className="text-primary">{t('guide.rsi.period')}</div>
                    <div className="text-primary">{t('guide.rsi.values')}</div>
                    <div className="mt-4 text-surface-600">
                      <div>{t('guide.rsi.formula1')}</div>
                      <div className="mt-2">{t('guide.rsi.formula2')}</div>
                      <div className="mt-4 text-surface-500 text-xs">
                        • {t('guide.rsi.note1')}<br />
                        • {t('guide.rsi.note2')}<br />
                        • {t('guide.rsi.note3')}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🔄 {t('guide.rsi.divergenceTitle')}</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-danger/10 border border-danger rounded-lg">
                      <h4 className="font-semibold text-danger mb-3">{t('guide.rsi.bearishTitle')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.rsi.bearishDesc1')}<br />
                        {t('guide.rsi.bearishDesc2')}
                      </p>
                      <p className="text-xs text-surface-500">
                        {t('guide.rsi.bearishResult')}
                      </p>
                    </div>
                    <div className="p-4 bg-success/10 border border-success rounded-lg">
                      <h4 className="font-semibold text-success mb-3">{t('guide.rsi.bullishTitle')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.rsi.bullishDesc1')}<br />
                        {t('guide.rsi.bullishDesc2')}
                      </p>
                      <p className="text-xs text-surface-500">
                        {t('guide.rsi.bullishResult')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 📉 MACD Section */}
          {activeTab === 'macd' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">{t('guide.macd.title')}</h2>
                <p className="text-surface-500 mb-6">
                  {t('guide.macd.desc')}
                </p>
                <IndicatorLevelTable levels={macdLevels} title={t('guide.macd.tableTitle')} />
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">📐 {t('guide.macd.formulaTitle')}</h3>
                  <div className="bg-surface-200 p-4 rounded font-mono text-sm space-y-2">
                    <div className="text-primary">{t('guide.macd.fast')}</div>
                    <div className="text-primary">{t('guide.macd.slow')}</div>
                    <div className="text-primary">{t('guide.macd.signal')}</div>
                    <div className="mt-4 text-surface-600">
                      <div>{t('guide.macd.formula1')}</div>
                      <div className="mt-2">{t('guide.macd.formula2')}</div>
                      <div className="mt-2 font-bold">{t('guide.macd.formula3')}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">⚡ {t('guide.macd.crossTitle')}</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-success/10 border border-success rounded-lg">
                      <h4 className="font-semibold text-success mb-3">{t('guide.macd.goldenTitle')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.macd.goldenDesc1')}<br />
                        {t('guide.macd.goldenDesc2')}
                      </p>
                      <p className="text-xs text-surface-500">
                        {t('guide.macd.goldenResult')}
                      </p>
                    </div>
                    <div className="p-4 bg-danger/10 border border-danger rounded-lg">
                      <h4 className="font-semibold text-danger mb-3">{t('guide.macd.deathTitle')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.macd.deathDesc1')}<br />
                        {t('guide.macd.deathDesc2')}
                      </p>
                      <p className="text-xs text-surface-500">
                        {t('guide.macd.deathResult')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 📊 Bollinger Bands Section */}
          {activeTab === 'bb' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">{t('guide.bb.title')}</h2>
                <p className="text-surface-500 mb-6">
                  {t('guide.bb.desc')}
                </p>

                <div className="space-y-6">
                  <IndicatorLevelTable levels={bbWidthLevels} title={t('guide.bb.widthTableTitle')} />
                  <IndicatorLevelTable levels={bbPositions} title={t('guide.bb.positionTableTitle')} />
                </div>
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">📐 {t('guide.bb.formulaTitle')}</h3>
                  <div className="bg-surface-200 p-4 rounded font-mono text-sm space-y-2">
                    <div className="text-primary">{t('guide.bb.period')}</div>
                    <div className="text-primary">{t('guide.bb.stdDev')}</div>
                    <div className="mt-4 text-surface-600">
                      <div>{t('guide.bb.formula1')}</div>
                      <div className="mt-2">{t('guide.bb.formula2')}</div>
                      <div className="mt-2">{t('guide.bb.formula3')}</div>
                      <div className="mt-4 font-bold text-primary">{t('guide.bb.formula4')}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🎯 {t('guide.bb.patternTitle')}</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-3">{t('guide.bb.squeezeTitle')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.bb.squeezeDesc')}
                      </p>
                      <p className="text-xs text-surface-500">
                        {t('guide.bb.squeezeNote')}
                      </p>
                    </div>
                    <div className="p-4 bg-danger/10 border border-danger rounded-lg">
                      <h4 className="font-semibold text-danger mb-3">{t('guide.bb.expansionTitle')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.bb.expansionDesc')}
                      </p>
                      <p className="text-xs text-surface-500">
                        {t('guide.bb.expansionNote')}
                      </p>
                    </div>
                    <div className="p-4 bg-success/10 border border-success rounded-lg">
                      <h4 className="font-semibold text-success mb-3">{t('guide.bb.upperWalkTitle')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.bb.upperWalkDesc')}
                      </p>
                      <p className="text-xs text-surface-500">
                        {t('guide.bb.upperWalkNote')}
                      </p>
                    </div>
                    <div className="p-4 bg-danger/10 border border-danger rounded-lg">
                      <h4 className="font-semibold text-danger mb-3">{t('guide.bb.lowerWalkTitle')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.bb.lowerWalkDesc')}
                      </p>
                      <p className="text-xs text-surface-500">
                        {t('guide.bb.lowerWalkNote')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 🚨 Alert System Section */}
          {activeTab === 'alerts' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">🚨 {t('guide.alertsSection.title')}</h2>
                <p className="text-surface-500 mb-6">
                  {t('guide.alertsSection.desc')}
                </p>

                {/* S-Tier Alerts */}
                <div className="card p-6 mb-6 border-2 border-red-500">
                  <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-red-500/20 border border-red-500 rounded text-sm">S</span>
                    {t('guide.alertsSection.sTier.title')}
                  </h3>

                  {/* S-01 */}
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">S-01: {t('guide.alertsSection.sTier.s01.name')}</h4>
                      <span className="px-2 py-1 bg-success text-white text-xs rounded font-bold">{t('guide.alertsSection.long')}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {t('guide.alertsSection.sTier.s01.desc')}
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s01.cond1')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s01.cond2')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s01.cond3')}</span>
                      </div>
                    </div>
                  </div>

                  {/* S-02 */}
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">S-02: {t('guide.alertsSection.sTier.s02.name')}</h4>
                      <span className="px-2 py-1 bg-danger text-white text-xs rounded font-bold">{t('guide.alertsSection.short')}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {t('guide.alertsSection.sTier.s02.desc')}
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s02.cond1')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s02.cond2')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s02.cond3')}</span>
                      </div>
                    </div>
                  </div>

                  {/* S-03 */}
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">S-03: {t('guide.alertsSection.sTier.s03.name')}</h4>
                      <span className="px-2 py-1 bg-success text-white text-xs rounded font-bold">{t('guide.alertsSection.long')}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {t('guide.alertsSection.sTier.s03.desc')}
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s03.cond1')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s03.cond2')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s03.cond3')}</span>
                      </div>
                    </div>
                  </div>

                  {/* S-04 */}
                  <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">S-04: {t('guide.alertsSection.sTier.s04.name')}</h4>
                      <span className="px-2 py-1 bg-danger text-white text-xs rounded font-bold">{t('guide.alertsSection.short')}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {t('guide.alertsSection.sTier.s04.desc')}
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s04.cond1')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s04.cond2')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">✓</span>
                        <span>{t('guide.alertsSection.sTier.s04.cond3')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* A-Tier Alerts */}
                <div className="card p-6 mb-6 border-2 border-orange-500">
                  <h3 className="text-xl font-bold text-orange-500 mb-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-orange-500/20 border border-orange-500 rounded text-sm">A</span>
                    {t('guide.alertsSection.aTier.title')}
                  </h3>

                  {/* A-01 */}
                  <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">A-01: {t('guide.alertsSection.aTier.a01.name')} ⭐</h4>
                      <span className="px-2 py-1 bg-success text-white text-xs rounded font-bold">{t('guide.alertsSection.long')}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {t('guide.alertsSection.aTier.a01.desc')}
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>{t('guide.alertsSection.aTier.a01.cond1')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>{t('guide.alertsSection.aTier.a01.cond2')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>{t('guide.alertsSection.aTier.a01.cond3')}</span>
                      </div>
                    </div>
                  </div>

                  {/* A-02 */}
                  <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">A-02: {t('guide.alertsSection.aTier.a02.name')}</h4>
                      <span className="px-2 py-1 bg-danger text-white text-xs rounded font-bold">{t('guide.alertsSection.short')}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {t('guide.alertsSection.aTier.a02.desc')}
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>{t('guide.alertsSection.aTier.a02.cond1')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>{t('guide.alertsSection.aTier.a02.cond2')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>{t('guide.alertsSection.aTier.a02.cond3')}</span>
                      </div>
                    </div>
                  </div>

                  {/* A-03 */}
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">A-03: {t('guide.alertsSection.aTier.a03.name')}</h4>
                      <span className="px-2 py-1 bg-success text-white text-xs rounded font-bold">{t('guide.alertsSection.long')}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {t('guide.alertsSection.aTier.a03.desc')}
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>{t('guide.alertsSection.aTier.a03.cond1')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>{t('guide.alertsSection.aTier.a03.cond2')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-500">✓</span>
                        <span>{t('guide.alertsSection.aTier.a03.cond3')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B-Tier Alerts */}
                <div className="card p-6 mb-6 border-2 border-yellow-500">
                  <h3 className="text-xl font-bold text-yellow-600 mb-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500 rounded text-sm">B</span>
                    {t('guide.alertsSection.bTier.title')}
                  </h3>

                  {/* B-01 */}
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">B-01: {t('guide.alertsSection.bTier.b01.name')}</h4>
                      <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded font-bold">{t('guide.alertsSection.wait')}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {t('guide.alertsSection.bTier.b01.desc')}
                    </p>
                  </div>

                  {/* B-02 */}
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">B-02: {t('guide.alertsSection.bTier.b02.name')}</h4>
                      <span className="px-2 py-1 bg-danger text-white text-xs rounded font-bold">{t('guide.alertsSection.caution')}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {t('guide.alertsSection.bTier.b02.desc')}
                    </p>
                  </div>

                  {/* B-03 */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-surface-600">B-03: {t('guide.alertsSection.bTier.b03.name')}</h4>
                      <span className="px-2 py-1 bg-success text-white text-xs rounded font-bold">{t('guide.alertsSection.long')}</span>
                    </div>
                    <p className="text-sm text-surface-600 mb-3">
                      {t('guide.alertsSection.bTier.b03.desc')}
                    </p>
                  </div>
                </div>

              </section>
            </>
          )}

          {/* ⚙️ Filters/Settings Section */}
          {activeTab === 'filters' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">⚙️ {t('guide.filtersSection.title')}</h2>
                <p className="text-surface-500 mb-6">
                  {t('guide.filtersSection.desc')}
                </p>

                {/* Timeframe */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">⏱️ {t('guide.filtersSection.timeframe.title')}</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">{t('guide.filtersSection.timeframe.1h')}</h4>
                      <p className="text-sm text-surface-600">
                        {t('guide.filtersSection.timeframe.1hDesc')}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">{t('guide.filtersSection.timeframe.4h')}</h4>
                      <p className="text-sm text-surface-600">
                        {t('guide.filtersSection.timeframe.4hDesc')}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">{t('guide.filtersSection.timeframe.8h')}</h4>
                      <p className="text-sm text-surface-600">
                        {t('guide.filtersSection.timeframe.8hDesc')}
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">{t('guide.filtersSection.timeframe.1d')}</h4>
                      <p className="text-sm text-surface-600">
                        {t('guide.filtersSection.timeframe.1dDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-500 p-4 rounded text-sm">
                    <p className="font-bold text-blue-600 mb-2">💡 {t('guide.filtersSection.timeframe.tip')}</p>
                    <p className="text-surface-600">
                      • {t('guide.filtersSection.timeframe.tipDesc1')}<br />
                      • {t('guide.filtersSection.timeframe.tipDesc2')}<br />
                      • {t('guide.filtersSection.timeframe.tipDesc3')}
                    </p>
                  </div>
                </div>

                {/* Symbol Filter */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🪙 {t('guide.filtersSection.symbol.title')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded">
                      <h4 className="font-semibold text-gray-600 mb-1">{t('guide.filtersSection.symbol.btc')}</h4>
                      <p className="text-xs text-surface-500">{t('guide.filtersSection.symbol.btcDesc')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded">
                      <h4 className="font-semibold text-gray-600 mb-1">{t('guide.filtersSection.symbol.eth')}</h4>
                      <p className="text-xs text-surface-500">{t('guide.filtersSection.symbol.ethDesc')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded">
                      <h4 className="font-semibold text-gray-600 mb-1">{t('guide.filtersSection.symbol.bnb')}</h4>
                      <p className="text-xs text-surface-500">{t('guide.filtersSection.symbol.bnbDesc')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded">
                      <h4 className="font-semibold text-gray-600 mb-1">{t('guide.filtersSection.symbol.sol')}</h4>
                      <p className="text-xs text-surface-500">{t('guide.filtersSection.symbol.solDesc')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded">
                      <h4 className="font-semibold text-gray-600 mb-1">{t('guide.filtersSection.symbol.xrp')}</h4>
                      <p className="text-xs text-surface-500">{t('guide.filtersSection.symbol.xrpDesc')}</p>
                    </div>
                    <div className="p-3 bg-primary/20 border-2 border-primary rounded">
                      <h4 className="font-semibold text-primary mb-1">{t('guide.filtersSection.symbol.all')}</h4>
                      <p className="text-xs text-surface-600">{t('guide.filtersSection.symbol.allDesc')}</p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 p-4 rounded text-sm">
                    <p className="font-bold text-yellow-600 mb-2">⚠️ {t('guide.filtersSection.symbol.warning')}</p>
                    <p className="text-surface-600">
                      • <strong>{t('guide.filtersSection.symbol.warningDesc1')}</strong><br />
                      • <strong>{t('guide.filtersSection.symbol.warningDesc2')}</strong><br />
                      • {t('guide.filtersSection.symbol.warningDesc3')}<br />
                      • {t('guide.filtersSection.symbol.warningDesc4')}
                    </p>
                  </div>
                </div>

                {/* Mute Toggle */}
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🔇 {t('guide.filtersSection.mute.title')}</h3>
                  <p className="text-sm text-surface-600 mb-4">
                    {t('guide.filtersSection.mute.desc')}
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-sm">
                    <p className="text-surface-600">
                      • {t('guide.filtersSection.mute.note1')}<br />
                      • {t('guide.filtersSection.mute.note2')}<br />
                      • {t('guide.filtersSection.mute.note3')}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* 💹 Trading Section */}
          {activeTab === 'trading' && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-surface-600 mb-4">💹 {t('guide.tradingSection.title')}</h2>
                <p className="text-surface-500 mb-6">
                  {t('guide.tradingSection.desc')}
                </p>

                {/* Warning */}
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 p-6 rounded-lg mb-6">
                  <h3 className="text-xl font-bold text-red-600 mb-3 flex items-center gap-2">
                    ⚠️ {t('guide.tradingSection.warning.title')}
                  </h3>
                  <ul className="space-y-2 text-sm text-red-700 dark:text-red-400">
                    <li>✓ {t('guide.tradingSection.warning.point1')}</li>
                    <li>✓ {t('guide.tradingSection.warning.point2')}</li>
                    <li>✓ {t('guide.tradingSection.warning.point3')}</li>
                    <li>✓ {t('guide.tradingSection.warning.point4')}</li>
                    <li>✓ {t('guide.tradingSection.warning.point5')}</li>
                  </ul>
                </div>

                {/* Overview */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🎯 {t('guide.tradingSection.overview.title')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-500 rounded">
                      <h4 className="font-semibold text-green-600 mb-2">✓ {t('guide.tradingSection.overview.provided')}</h4>
                      <ul className="text-sm text-surface-600 space-y-1">
                        {t('guide.tradingSection.overview.providedList', { returnObjects: true }).map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded">
                      <h4 className="font-semibold text-red-600 mb-2">✗ {t('guide.tradingSection.overview.notProvided')}</h4>
                      <ul className="text-sm text-surface-600 space-y-1">
                        {t('guide.tradingSection.overview.notProvidedList', { returnObjects: true }).map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* How to Trade */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">📖 {t('guide.tradingSection.howTo.title')}</h3>

                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">1️⃣ {t('guide.tradingSection.howTo.step1Title')}</h4>
                      <p className="text-sm text-surface-600">
                        {t('guide.tradingSection.howTo.step1Desc')}
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">2️⃣ {t('guide.tradingSection.howTo.step2Title')}</h4>
                      <p className="text-sm text-surface-600">
                        {t('guide.tradingSection.howTo.step2Desc')}<br />
                        {t('guide.tradingSection.howTo.step2Intervals')}<br />
                        <span className="text-success font-semibold">{t('guide.tradingSection.howTo.step2Colors')}</span>
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">3️⃣ {t('guide.tradingSection.howTo.step3Title')}</h4>
                      <div className="grid md:grid-cols-2 gap-3 mt-2">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded">
                          <p className="font-semibold text-surface-600 mb-1">{t('guide.tradingSection.howTo.step3Market')}</p>
                          <p className="text-xs text-surface-500">{t('guide.tradingSection.howTo.step3MarketDesc')}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded">
                          <p className="font-semibold text-surface-600 mb-1">{t('guide.tradingSection.howTo.step3Limit')}</p>
                          <p className="text-xs text-surface-500">{t('guide.tradingSection.howTo.step3LimitDesc')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">4️⃣ {t('guide.tradingSection.howTo.step4Title')}</h4>
                      <div className="grid md:grid-cols-2 gap-3 mt-2">
                        <div className="p-3 bg-success/10 border border-success rounded">
                          <p className="font-semibold text-success mb-1">{t('guide.tradingSection.howTo.step4Long')}</p>
                          <p className="text-xs text-surface-600">
                            {t('guide.tradingSection.howTo.step4LongDesc')}
                          </p>
                        </div>
                        <div className="p-3 bg-danger/10 border border-danger rounded">
                          <p className="font-semibold text-danger mb-1">{t('guide.tradingSection.howTo.step4Short')}</p>
                          <p className="text-xs text-surface-600">
                            {t('guide.tradingSection.howTo.step4ShortDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">5️⃣ {t('guide.tradingSection.howTo.step5Title')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.tradingSection.howTo.step5Desc')}
                      </p>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded text-xs">
                        <p className="font-semibold mb-1">{t('guide.tradingSection.howTo.step5Example')}</p>
                        <p className="text-surface-600">
                          • {t('guide.tradingSection.howTo.step5Example1')}<br />
                          • {t('guide.tradingSection.howTo.step5Example2')}<br />
                          • {t('guide.tradingSection.howTo.step5Example3')}
                        </p>
                      </div>
                    </div>

                    {/* Step 6 */}
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <h4 className="font-semibold text-primary mb-2">6️⃣ {t('guide.tradingSection.howTo.step6Title')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.tradingSection.howTo.step6Desc')}
                      </p>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 p-3 rounded text-xs">
                        <p className="font-semibold text-yellow-600 mb-1">⚠️ {t('guide.tradingSection.howTo.step6MaxBuy')}</p>
                        <p className="text-surface-600">
                          {t('guide.tradingSection.howTo.step6Formula')}<br />
                          {t('guide.tradingSection.howTo.step6Example')}
                        </p>
                      </div>
                    </div>

                    {/* Step 7 */}
                    <div className="p-4 bg-success/10 border border-success rounded-lg">
                      <h4 className="font-semibold text-success mb-2">7️⃣ {t('guide.tradingSection.howTo.step7Title')}</h4>
                      <p className="text-sm text-surface-600">
                        {t('guide.tradingSection.howTo.step7Desc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Position Management */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">📊 {t('guide.tradingSection.positionManagement.title')}</h3>

                  <div className="space-y-4">
                    {/* Positions Tab */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-500 rounded">
                      <h4 className="font-semibold text-blue-600 mb-2">{t('guide.tradingSection.positionManagement.positionsTab')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.tradingSection.positionManagement.positionsDesc')}
                      </p>
                      <ul className="text-xs text-surface-600 space-y-1">
                        <li>• <strong>{t('guide.tradingSection.positionManagement.entryPrice')}</strong></li>
                        <li>• <strong>{t('guide.tradingSection.positionManagement.currentPrice')}</strong></li>
                        <li>• <strong>{t('guide.tradingSection.positionManagement.size')}</strong></li>
                        <li>• <strong>{t('guide.tradingSection.positionManagement.leverage')}</strong></li>
                        <li>• <strong>{t('guide.tradingSection.positionManagement.pnl')}</strong></li>
                        <li>• <strong>{t('guide.tradingSection.positionManagement.close')}</strong></li>
                      </ul>
                    </div>

                    {/* Orders Tab */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-500 rounded">
                      <h4 className="font-semibold text-green-600 mb-2">{t('guide.tradingSection.positionManagement.ordersTab')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.tradingSection.positionManagement.ordersDesc')}
                      </p>
                      <ul className="text-xs text-surface-600 space-y-1">
                        <li>• {t('guide.tradingSection.positionManagement.ordersNote1')}</li>
                        <li>• {t('guide.tradingSection.positionManagement.ordersNote2')}</li>
                        <li>• {t('guide.tradingSection.positionManagement.ordersNote3')}</li>
                      </ul>
                    </div>

                    {/* History Tab */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-500 rounded">
                      <h4 className="font-semibold text-purple-600 mb-2">{t('guide.tradingSection.positionManagement.historyTab')}</h4>
                      <p className="text-sm text-surface-600 mb-2">
                        {t('guide.tradingSection.positionManagement.historyDesc')}
                      </p>
                      <ul className="text-xs text-surface-600 space-y-1">
                        <li>• {t('guide.tradingSection.positionManagement.historyNote1')}</li>
                        <li>• {t('guide.tradingSection.positionManagement.historyNote2')}</li>
                        <li>• {t('guide.tradingSection.positionManagement.historyNote3')}</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 p-4 rounded text-sm mt-4">
                    <p className="font-bold text-yellow-600 mb-2">💡 {t('guide.tradingSection.positionManagement.pnlCalc')}</p>
                    <div className="text-surface-600 space-y-2 text-sm">
                      <p><strong>{t('guide.tradingSection.positionManagement.pnlLong')}</strong></p>
                      <p><strong>{t('guide.tradingSection.positionManagement.pnlShort')}</strong></p>
                      <p className="text-xs text-surface-500">{t('guide.tradingSection.positionManagement.pnlNote')}</p>
                    </div>
                  </div>
                </div>

                {/* Ranking */}
                <div className="card p-6 mb-6">
                  <h3 className="text-xl font-bold text-surface-600 mb-4">🏆 {t('guide.tradingSection.ranking.title')}</h3>
                  <p className="text-sm text-surface-600 mb-4">
                    {t('guide.tradingSection.ranking.desc')}
                  </p>
                  <div className="bg-primary/10 border border-primary p-4 rounded">
                    <p className="text-sm text-surface-600">
                      • {t('guide.tradingSection.ranking.note1')}<br />
                      • {t('guide.tradingSection.ranking.note2')}<br />
                      • {t('guide.tradingSection.ranking.note3')}<br />
                      • {t('guide.tradingSection.ranking.note4')}
                    </p>
                  </div>
                </div>

                {/* Risk Warning */}
                <div className="card p-6 border-2 border-red-500">
                  <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ {t('guide.tradingSection.riskWarning.title')}</h3>
                  <div className="space-y-3 text-sm text-surface-600">
                    <p>
                      <strong className="text-red-600">{t('guide.tradingSection.riskWarning.risk1Title')}</strong><br />
                      {t('guide.tradingSection.riskWarning.risk1Desc')}
                    </p>
                    <p>
                      <strong className="text-red-600">{t('guide.tradingSection.riskWarning.risk2Title')}</strong><br />
                      {t('guide.tradingSection.riskWarning.risk2Desc')}
                    </p>
                    <p>
                      <strong className="text-red-600">{t('guide.tradingSection.riskWarning.risk3Title')}</strong><br />
                      {t('guide.tradingSection.riskWarning.risk3Desc')}
                    </p>
                    <p>
                      <strong className="text-red-600">{t('guide.tradingSection.riskWarning.risk4Title')}</strong><br />
                      {t('guide.tradingSection.riskWarning.risk4Desc')}
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
