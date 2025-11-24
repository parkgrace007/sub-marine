import React, { useMemo, useEffect, useState } from 'react'
import { useMarketData } from '../hooks/useMarketData'
import { useWhaleData } from '../hooks/useWhaleData'
import { transformToComboData } from '../utils/alertComboTransformer'
import { ALERT_COMBOS } from '../constants/SubMarine_AlertCombos'
import { supabase } from '../utils/supabase'
import soundManager from '../utils/SoundManager'
import CoinIcon from './CoinIcon'

/**
 * 🔱 메인얼럿 (God-Tier Alert System)
 * ALERT_COMBOS 로직을 기반으로 가장 중요한 시장 신호를 표시합니다.
 *
 * Priority 순서: S(1) > A(2) > B(3)
 * Type 별 색상: LONG(Green) / SHORT(Red) / HOLD(Yellow)
 */
function ImportantAlertCard({ timeframe = '1h', symbol = '통합' }) {
  // Fetch market data
  const sentiment = useMarketData(timeframe, symbol)
  const { whales, loading: whalesLoading } = useWhaleData(timeframe, ['inflow', 'outflow'])

  // Track S-001 WHALE_SURGE alerts (2025-11-22)
  const [whaleSurgeAlert, setWhaleSurgeAlert] = useState(null)
  const [playedAlertIds, setPlayedAlertIds] = useState(new Set())

  // Subscribe to S-001 alerts from alerts table
  useEffect(() => {
    // Fetch latest S-001 alert (within last 10 minutes)
    async function fetchLatestSurgeAlert() {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('signal_type', 'S-001')
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!error && data && data.length > 0) {
        const alert = data[0]
        setWhaleSurgeAlert(alert)

        // Play sound for new alerts (only once per alert)
        if (!playedAlertIds.has(alert.id)) {
          soundManager.play('alert-critical')
          setPlayedAlertIds(prev => new Set([...prev, alert.id]))
        }
      } else {
        setWhaleSurgeAlert(null)
      }
    }

    fetchLatestSurgeAlert()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('surge-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: 'signal_type=eq.S-001'
        },
        (payload) => {
          console.log('🚨 S-001 WHALE SURGE detected:', payload.new)
          setWhaleSurgeAlert(payload.new)

          // Play critical alert sound
          if (!playedAlertIds.has(payload.new.id)) {
            soundManager.play('alert-critical')
            setPlayedAlertIds(prev => new Set([...prev, payload.new.id]))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Detect active combo
  const activeCombo = useMemo(() => {
    // Skip if data is still loading
    if (sentiment.loading || whalesLoading) {
      return null
    }

    // Transform raw data to combo format
    const comboData = transformToComboData(sentiment, whales)

    // Scan all combos and find matching ones
    const matchingCombos = ALERT_COMBOS.filter((combo) => {
      try {
        return combo.condition(comboData)
      } catch (error) {
        console.warn(`⚠️ Combo ${combo.id} condition error:`, error)
        return false
      }
    })

    // If no match, return null
    if (matchingCombos.length === 0) {
      return null
    }

    // Sort by priority (1 > 2 > 3) and pick the first one
    matchingCombos.sort((a, b) => a.priority - b.priority)
    return matchingCombos[0]
  }, [sentiment, whales, whalesLoading])

  // Determine UI theme based on combo type (Design System compliant)
  const getTheme = () => {
    if (!activeCombo) {
      return {
        containerClass: 'bg-surface-200 border-surface-300',
        headerClass: 'text-surface-500',
        titleClass: 'text-surface-600',
        descClass: 'text-surface-500',
        tierBadgeClass: '',
        typeBadgeClass: '',
        glowClass: ''
      }
    }

    const { type, tier } = activeCombo
    let containerClass, headerClass, titleClass, descClass, typeBadgeClass, glowClass

    // Tier B: Neutral & Dry theme (white-based, no color coding)
    if (tier === 'B') {
      containerClass = 'bg-surface-200/60 border-surface-400'
      headerClass = 'text-surface-600'
      titleClass = 'text-surface-600 font-semibold'
      descClass = 'text-surface-500'
      typeBadgeClass = 'bg-surface-300 text-surface-600 border border-surface-400'
      glowClass = ''
    } else {
      // Tier S/A: Type-based colors (Design System)
      if (type === 'LONG') {
        containerClass = 'bg-success/10 border-success/40'
        headerClass = 'text-success'
        titleClass = 'text-success font-semibold'
        descClass = 'text-success/90'
        typeBadgeClass = 'bg-success/20 text-success border border-success/30'
      } else if (type === 'SHORT') {
        containerClass = 'bg-danger/10 border-danger/40'
        headerClass = 'text-danger'
        titleClass = 'text-danger font-semibold'
        descClass = 'text-danger/90'
        typeBadgeClass = 'bg-danger/20 text-danger border border-danger/30'
      } else {
        // HOLD
        containerClass = 'bg-warning/10 border-warning/40'
        headerClass = 'text-warning'
        titleClass = 'text-warning font-semibold'
        descClass = 'text-warning/90'
        typeBadgeClass = 'bg-warning/20 text-warning border border-warning/30'
      }
    }

    // Tier badge (Design System tier colors)
    let tierBadgeClass
    if (tier === 'S') {
      tierBadgeClass = 'bg-tier-s text-primary-text font-bold'
      glowClass = tier === 'B' ? '' : 'tier-s-glow' // No glow for Tier B
    } else if (tier === 'A') {
      tierBadgeClass = 'bg-tier-a text-surface-100 font-semibold'
      glowClass = ''
    } else {
      tierBadgeClass = 'bg-surface-400 text-surface-100 font-medium'
      glowClass = ''
    }

    return {
      containerClass,
      headerClass,
      titleClass,
      descClass,
      tierBadgeClass,
      typeBadgeClass,
      glowClass
    }
  }

  const theme = getTheme()

  // Render content
  const renderContent = () => {
    // Priority 1: S-001 WHALE_SURGE (2025-11-22)
    if (whaleSurgeAlert) {
      const conditions = whaleSurgeAlert.conditions || {}
      const topWhales = conditions.top_whales || []

      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-danger uppercase tracking-wide font-bold">
              긴급 알림
            </span>
            <span className="px-2 py-0.5 text-[10px] bg-tier-s text-primary-text rounded font-bold animate-pulse">
              S-TIER
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-danger mb-1">
              🚨 대량 고래 급증 감지
            </h3>
            <p className="text-xs text-danger/90 mb-2 leading-relaxed">
              {conditions.time_window} 동안 {conditions.whale_count}건의 대형 거래 ($100M+) 발생
            </p>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-surface-500">총 거래량:</span>
                <span className="font-bold text-danger">{conditions.total_volume_formatted}</span>
              </div>
              {topWhales.length > 0 && (
                <div className="mt-2 pt-2 border-t border-danger/20">
                  <div className="text-[10px] text-surface-500 mb-1">상위 거래:</div>
                  {topWhales.slice(0, 2).map((whale, i) => (
                    <div key={i} className="text-[10px] flex items-center justify-between text-danger/80 gap-2">
                      <div className="flex items-center gap-1.5">
                        <CoinIcon symbol={whale.symbol} size={14} />
                        <span>{whale.symbol} ({whale.flow_type})</span>
                      </div>
                      <span className="font-mono">{whale.amount_formatted}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (sentiment.loading || whalesLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-surface-500">
            현재 중요한 시장 신호가 없습니다.
          </p>
        </div>
      )
    }

    // Priority 2: ALERT_COMBOS
    if (!activeCombo) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-surface-500">
            현재 중요한 시장 신호가 없습니다.
          </p>
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 text-[10px] rounded ${theme.tierBadgeClass}`}>
            TIER {activeCombo.tier}
          </span>
          <span className={`px-2 py-0.5 text-[10px] rounded ${theme.typeBadgeClass}`}>
            {activeCombo.type}
          </span>
        </div>

        {/* Title */}
        <div className={`text-base mb-2 leading-tight ${theme.titleClass}`}>
          {activeCombo.title}
        </div>

        {/* Description */}
        <div className="flex-1 flex items-center">
          <p className={`text-xs leading-relaxed ${theme.descClass}`}>
            {activeCombo.desc}
          </p>
        </div>
      </div>
    )
  }

  // Override theme for S-001 WHALE_SURGE alerts
  const containerClass = whaleSurgeAlert
    ? 'bg-danger/10 border-danger border-2'
    : theme.containerClass

  const glowClass = whaleSurgeAlert
    ? 'animate-pulse-slow'
    : theme.glowClass

  return (
    <div className={`
      ${containerClass}
      rounded-md p-4 min-h-[141px]
      ${glowClass}
      transition-all duration-300
    `}>
      {renderContent()}
    </div>
  )
}

export default ImportantAlertCard
