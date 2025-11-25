import React from 'react'
import { useTranslation } from 'react-i18next'
import ImportantAlertCard from './ImportantAlertCard'
import IndicatorCardsGrid from './IndicatorCardsGrid'
import AlertLogTerminal from './AlertLogTerminal'
import DeepDiveReport from './DeepDiveReport'

/**
 * AlertDualPanel - 반응형 레이아웃 컨테이너
 *
 * Desktop Layout (2열):
 * ┌─────────────────────┬─────────────────────┐
 * │ 중요알림 카드       │ 4개 지표 (2x2)      │
 * │                     │ PRICE│RSI           │
 * │ 로그 터미널         │ MACD │BB WIDTH      │
 * │ (기존 alerts)       │                     │
 * │                     │ 빈 로그 터미널      │
 * └─────────────────────┴─────────────────────┘
 *
 * Mobile Layout (1열):
 * ┌─────────────────────┐
 * │ 4개 지표 (2x2)      │
 * ├─────────────────────┤
 * │ 중요알림 카드       │
 * ├─────────────────────┤
 * │ 중요알림 LOG        │
 * ├─────────────────────┤
 * │ DEEP DIVE REPORT    │
 * └─────────────────────┘
 */
function AlertDualPanel({
  alerts = [],
  timeframe = '1h',
  symbol = '통합',
  className = ''
}) {
  const { t } = useTranslation()

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-2 ${className}`}>
      {/* 1. IndicatorCardsGrid - 모바일: 1순위, 데스크톱: 오른쪽 상단 */}
      <div className="order-1 lg:col-start-2 lg:row-start-1">
        <IndicatorCardsGrid timeframe={timeframe} symbol={symbol} />
      </div>

      {/* 2. ImportantAlertCard - 모바일: 2순위, 데스크톱: 왼쪽 상단 */}
      <div className="order-2 lg:col-start-1 lg:row-start-1">
        <ImportantAlertCard timeframe={timeframe} symbol={symbol} />
      </div>

      {/* 3. 중요알림 LOG - 모바일: 3순위, 데스크톱: 왼쪽 하단 */}
      <div className="order-3 lg:col-start-1 lg:row-start-2">
        <AlertLogTerminal
          alerts={alerts}
          title={t('alerts.importantLog')}
          className="h-[400px]"
          emptyState={t('alerts.noActiveAlerts')}
        />
      </div>

      {/* 4. DEEP DIVE REPORT - 모바일: 4순위, 데스크톱: 오른쪽 하단 */}
      <div className="order-4 lg:col-start-2 lg:row-start-2">
        <DeepDiveReport className="h-[400px]" />
      </div>
    </div>
  )
}

export default AlertDualPanel
