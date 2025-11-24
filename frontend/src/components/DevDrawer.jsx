import React, { useState, useEffect } from 'react'
import { useMarketData } from '../hooks/useMarketData' // Replaced useSentiment with useMarketData (Binance API)
import { supabase } from '../utils/supabase'

/**
 * DevDrawer - 개발자용 기술 지표 서랍 UI
 *
 * 4개 탭 구조:
 * 1. 📊 지표 원본값 - RSI, MACD 실시간 값 + 설명
 * 2. 🚨 알림 시그널 - 8개 시그널 조합 조건 시각화
 * 3. 📡 데이터 흐름 - API → DB → Frontend 흐름도
 * 4. ⚙️ 설정 - 캐시 관리, 시스템 설정
 */
function DevDrawer({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  timeframe = '1h',
  whales = [],
  alerts: externalAlerts = [],
  onClearCache
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('indicators') // 'indicators', 'signals', 'dataflow', 'settings'
  const [internalAlerts, setInternalAlerts] = useState([])

  // Use external control if provided, otherwise internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalOnClose ? () => externalOnClose() : setInternalIsOpen
  const alerts = externalAlerts.length > 0 ? externalAlerts : internalAlerts

  // Fetch market data from Binance API (contains all indicators)
  const sentiment = useMarketData(timeframe, 'TOTAL')

  // Subscribe to alerts table (only if not provided externally)
  useEffect(() => {
    if (externalAlerts.length > 0) return // Skip if alerts provided externally

    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        setInternalAlerts(data)
      }
    }

    fetchAlerts()

    // Real-time subscription
    const channel = supabase
      .channel('dev-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts'
      }, (payload) => {
        setInternalAlerts(prev => [payload.new, ...prev].slice(0, 20))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [externalAlerts.length])

  // Calculate alert signal conditions
  const calculateSignalConditions = () => {
    if (!sentiment || sentiment.loading) return []

    const signals = []

    // Helper: Get whale weight (total inflow - outflow in last hour) (2025-11-23: flow types)
    const getWhaleWeight = () => {
      const inflowWeight = whales.filter(w => w.flow_type === 'inflow').reduce((sum, w) => sum + (w.amount_usd || 0), 0)
      const outflowWeight = whales.filter(w => w.flow_type === 'outflow').reduce((sum, w) => sum + (w.amount_usd || 0), 0)
      return (inflowWeight - outflowWeight) / 1000000 // Convert to millions
    }

    // S-002: Perfect Confluence
    const s002 = {
      id: 'S-002',
      tier: 'S',
      name: 'Perfect Confluence',
      priority: 100,
      conditions: {
        rsi_1h_breakout: { value: sentiment.rsi_average > 70, required: true, description: '1h RSI > 70 (과열)', current: sentiment.rsi_average?.toFixed(2) },
        whale_level5: { value: whales.some(w => w.amount_usd >= 5000000), required: true, description: '$5M+ 고래 존재', current: whales.filter(w => w.amount_usd >= 5000000).length },
        macd_positive: { value: sentiment.macd_histogram > 0.5, required: 0.5, description: 'MACD 히스토그램 > 0.5', current: sentiment.macd_histogram?.toFixed(4) }
      },
      message: '🚨 PERFECT CONFLUENCE - Strong bullish signal detected!'
    }

    const s002Met = Object.values(s002.conditions).filter(c => c.value === true).length
    const s002Total = Object.keys(s002.conditions).length
    s002.active = s002Met === s002Total
    s002.conditionsMet = `${s002Met}/${s002Total}`
    signals.push(s002)

    // A-002: Whale Momentum Sync
    const whaleWeight = getWhaleWeight()
    const a002 = {
      id: 'A-002',
      tier: 'A',
      name: 'Whale Momentum Sync',
      priority: 50,
      conditions: {
        whale_weight_range: { value: whaleWeight >= 20 && whaleWeight <= 40, required: [20, 40], description: '$20-40M 순매수', current: `$${whaleWeight.toFixed(1)}M` },
        macd_increasing: { value: sentiment.macd_histogram > 0, required: true, description: 'MACD 히스토그램 > 0', current: sentiment.macd_histogram?.toFixed(4) },
        rsi_uptrend: { value: sentiment.rsi_average >= 50 && sentiment.rsi_average <= 70, required: [50, 70], description: 'RSI 50-70 범위', current: sentiment.rsi_average?.toFixed(2) }
      },
      message: '📈 Whale Momentum Sync - Whales align with uptrend'
    }

    const a002Met = Object.values(a002.conditions).filter(c => c.value === true).length
    const a002Total = Object.keys(a002.conditions).length
    a002.active = a002Met === a002Total
    a002.conditionsMet = `${a002Met}/${a002Total}`
    signals.push(a002)

    // B-002: Whale Distribution (2025-11-23: outflow terminology)
    const outflowWhales = whales.filter(w => w.flow_type === 'outflow')
    const outflowWeight = outflowWhales.reduce((sum, w) => sum + (w.amount_usd || 0), 0) / 1000000
    const b002 = {
      id: 'B-002',
      tier: 'B',
      name: 'Whale Distribution',
      priority: 20,
      conditions: {
        whale_outflows: { value: outflowWhales.length >= 3, required: 3, description: '3개 이상 유출 거래', current: outflowWhales.length },
        weight_range: { value: outflowWeight >= 10, required: 10, description: '$10M+ 총 유출', current: `$${outflowWeight.toFixed(1)}M` },
        rsi_overbought: { value: sentiment.rsi_average > 70, required: 70, description: 'RSI > 70 (과열)', current: sentiment.rsi_average?.toFixed(2) }
      },
      message: '⚠️ Whale Distribution - Smart money flowing out'
    }

    const b002Met = Object.values(b002.conditions).filter(c => c.value === true).length
    const b002Total = Object.keys(b002.conditions).length
    b002.active = b002Met === b002Total
    b002.conditionsMet = `${b002Met}/${b002Total}`
    signals.push(b002)

    // C-001: RSI Level Change
    // RSI Level classification (1-10) - matches backend alertSystem.js RSI_LEVELS
    const getRSILevel = (rsi) => {
      if (rsi <= 10) return 1   // Extreme oversold
      if (rsi <= 20) return 2   // Very oversold
      if (rsi <= 30) return 3   // Oversold
      if (rsi <= 40) return 4   // Bearish
      if (rsi <= 50) return 5   // Neutral low
      if (rsi <= 60) return 6   // Neutral high
      if (rsi <= 70) return 7   // Bullish
      if (rsi <= 80) return 8   // Overbought
      if (rsi <= 90) return 9   // Very overbought
      return 10                  // Extreme overbought
    }
    const c001 = {
      id: 'C-001',
      tier: 'C',
      name: 'RSI Level Change',
      priority: 5,
      conditions: {
        rsi_level: { value: true, required: 'Level 1-10', description: 'RSI 레벨 (1-10)', current: `Level ${getRSILevel(sentiment.rsi_average || 50)}` }
      },
      message: '📊 RSI Level Change'
    }
    c001.active = false // Need historical data to check level change
    c001.conditionsMet = '1/1'
    signals.push(c001)

    // C-002: MACD Cross
    const c002 = {
      id: 'C-002',
      tier: 'C',
      name: 'MACD Cross',
      priority: 5,
      conditions: {
        macd_cross: { value: sentiment.macd_cross === 'golden' || sentiment.macd_cross === 'death', required: true, description: 'MACD 골든/데드 크로스', current: sentiment.macd_cross || 'none' }
      },
      message: sentiment.macd_cross === 'golden' ? '📈 MACD Golden Cross' : 'MACD Death Cross'
    }
    const c002Met = c002.conditions.macd_cross.value ? 1 : 0
    c002.active = c002Met === 1
    c002.conditionsMet = `${c002Met}/1`
    signals.push(c002)

    // C-003: Whale Spotted
    const significantWhales = whales.filter(w => w.amount_usd >= 1000000)
    const c003 = {
      id: 'C-003',
      tier: 'C',
      name: 'Whale Spotted',
      priority: 5,
      conditions: {
        whale_1m: { value: significantWhales.length > 0, required: true, description: '$1M+ 고래 발견', current: significantWhales.length }
      },
      message: '🐋 Whale Spotted'
    }
    const c003Met = c003.conditions.whale_1m.value ? 1 : 0
    c003.active = c003Met === 1
    c003.conditionsMet = `${c003Met}/1`
    signals.push(c003)

    return signals
  }

  const signals = calculateSignalConditions()

  // Tier colors
  const tierColors = {
    S: 'bg-red-500/20 border-red-500 text-red-400',
    A: 'bg-orange-500/20 border-orange-500 text-orange-400',
    B: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
    C: 'bg-blue-500/20 border-blue-500 text-blue-400'
  }

  return (
    <>
      {/* Toggle Button - Fixed bottom right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gray-800/90 hover:bg-gray-700/90 backdrop-blur-md border border-white/20 rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 group"
        title="개발자 도구 열기"
      >
        <span className="text-2xl group-hover:rotate-45 transition-transform duration-300 inline-block">
          🔧
        </span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[700px] bg-gray-900/95 backdrop-blur-md border-l border-white/20 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-white/20 p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🔧</span>
              <span>개발자 도구</span>
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('indicators')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                activeTab === 'indicators'
                  ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                  : 'bg-gray-800/50 border border-white/10 text-white/60 hover:text-white'
              }`}
            >
              📊 지표
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                activeTab === 'signals'
                  ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                  : 'bg-gray-800/50 border border-white/10 text-white/60 hover:text-white'
              }`}
            >
              🚨 시그널
            </button>
            <button
              onClick={() => setActiveTab('dataflow')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                activeTab === 'dataflow'
                  ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                  : 'bg-gray-800/50 border border-white/10 text-white/60 hover:text-white'
              }`}
            >
              📡 흐름
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                activeTab === 'settings'
                  ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                  : 'bg-gray-800/50 border border-white/10 text-white/60 hover:text-white'
              }`}
            >
              ⚙️ 설정
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tab 1: Indicators */}
          {activeTab === 'indicators' && (
            <div className="space-y-4">
              {/* RSI Section */}
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span>📊</span>
                  <span>RSI (Relative Strength Index)</span>
                </h3>
                <p className="text-xs text-white/60 mb-3">
                  상대강도지수. 14일 기준 모멘텀 측정. 30 이하=과매도, 70 이상=과매수
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">평균 (BTC+ETH+XRP)</span>
                    <span className={`text-lg font-mono font-bold ${
                      sentiment.rsi_average > 70 ? 'text-red-400' : sentiment.rsi_average < 30 ? 'text-blue-400' : 'text-white'
                    }`}>
                      {sentiment.loading ? '...' : sentiment.rsi_average?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">BTC 개별값</span>
                    <span className="text-md font-mono text-white/80">
                      {sentiment.loading ? '...' : sentiment.rsi_btc?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">상태</span>
                    <div className="flex gap-2">
                      {sentiment.rsi_oversold && (
                        <span className="px-2 py-1 bg-blue-500/20 border border-blue-500 text-blue-400 text-xs rounded">
                          과매도
                        </span>
                      )}
                      {sentiment.rsi_overbought && (
                        <span className="px-2 py-1 bg-red-500/20 border border-red-500 text-red-400 text-xs rounded">
                          과매수
                        </span>
                      )}
                      {!sentiment.rsi_oversold && !sentiment.rsi_overbought && (
                        <span className="px-2 py-1 bg-gray-500/20 border border-gray-500 text-gray-400 text-xs rounded">
                          중립
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* MACD Section */}
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span>📈</span>
                  <span>MACD (Moving Average Convergence Divergence)</span>
                </h3>
                <p className="text-xs text-white/60 mb-3">
                  이동평균 수렴확산. MACD {'>'} Signal = 상승 모멘텀
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">MACD Line (12-26 EMA)</span>
                    <span className="text-lg font-mono font-bold text-white">
                      {sentiment.loading ? '...' : sentiment.macd_line?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">Signal Line (9 EMA)</span>
                    <span className="text-md font-mono text-white/80">
                      {sentiment.loading ? '...' : sentiment.macd_signal?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">Histogram (Line - Signal)</span>
                    <span className={`text-lg font-mono font-bold ${
                      sentiment.macd_histogram > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {sentiment.loading ? '...' : sentiment.macd_histogram?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">크로스 상태</span>
                    <div>
                      {sentiment.macd_cross === 'golden' && (
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500 text-green-400 text-xs rounded">
                          📈 골든 크로스
                        </span>
                      )}
                      {sentiment.macd_cross === 'death' && (
                        <span className="px-2 py-1 bg-red-500/20 border border-red-500 text-red-400 text-xs rounded">
                          📉 데드 크로스
                        </span>
                      )}
                      {!sentiment.macd_cross && (
                        <span className="px-2 py-1 bg-gray-500/20 border border-gray-500 text-gray-400 text-xs rounded">
                          없음
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3">📝 메타데이터</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">타임프레임</span>
                    <span className="font-mono text-white">{timeframe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">심볼</span>
                    <span className="font-mono text-white">TOTAL (BTC+ETH+XRP)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">데이터 소스</span>
                    <span className="font-mono text-white">Binance API</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">업데이트</span>
                    <span className="font-mono text-white">
                      {sentiment.loading ? '로딩 중...' : '실시간 (2-8분)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Signals */}
          {activeTab === 'signals' && (
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-2">🚨 알림 시그널 조합</h3>
                <p className="text-xs text-white/60 mb-4">
                  기술 지표가 어떻게 조합되어 알림을 생성하는지 실시간으로 확인
                </p>
              </div>

              {signals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} tierColors={tierColors} />
              ))}

              {/* Recent Alerts */}
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3">📋 최근 발생한 알림</h3>
                {alerts.length === 0 ? (
                  <p className="text-sm text-white/60">아직 발생한 알림이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="bg-gray-900/50 border border-white/10 rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${tierColors[alert.tier]}`}>
                            {alert.tier}
                          </span>
                          <span className="text-xs text-white/40 font-mono">
                            {new Date(alert.created_at).toLocaleTimeString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-sm text-white/90">{alert.message}</p>
                        <p className="text-xs text-white/60 mt-1">
                          {alert.signal_type} • {alert.timeframe || timeframe}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Cache Management */}
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span>🗑️</span>
                  <span>캐시 관리</span>
                </h3>
                <p className="text-xs text-white/60 mb-4">
                  브라우저 캐시가 오래되어 데이터가 표시되지 않을 때 사용하세요.
                </p>

                {/* Cache Info */}
                <div className="bg-gray-900/50 border border-white/10 rounded-lg p-3 mb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">localStorage 사용</span>
                      <span className="font-mono text-white">
                        {Object.keys(localStorage).length}개 항목
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Zustand Store</span>
                      <span className="font-mono text-white">
                        {localStorage.getItem('trading-storage-v2') ? '✓ 존재' : '✗ 없음'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">캐시 버전</span>
                      <span className="font-mono text-white">v3</span>
                    </div>
                  </div>
                </div>

                {/* Clear Cache Button */}
                {onClearCache && (
                  <button
                    onClick={onClearCache}
                    className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">🗑️</span>
                    <span>캐시 모두 삭제</span>
                  </button>
                )}

                {!onClearCache && (
                  <div className="text-xs text-white/40 text-center p-3 bg-gray-900/50 border border-white/10 rounded">
                    캐시 삭제 기능이 활성화되지 않았습니다.
                  </div>
                )}

                <div className="mt-3 text-xs text-white/40">
                  <p>⚠️ 캐시를 삭제하면:</p>
                  <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                    <li>거래 데이터 초기화</li>
                    <li>로그인 세션 삭제</li>
                    <li>설정 정보 초기화</li>
                    <li>페이지 자동 새로고침</li>
                  </ul>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span>💻</span>
                  <span>시스템 정보</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">User Agent</span>
                    <span className="font-mono text-white/80 text-xs truncate max-w-xs">
                      {navigator.userAgent.split(' ').slice(-2).join(' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">화면 크기</span>
                    <span className="font-mono text-white">
                      {window.innerWidth} × {window.innerHeight}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">언어</span>
                    <span className="font-mono text-white">{navigator.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">온라인 상태</span>
                    <span className={`font-mono ${navigator.onLine ? 'text-green-400' : 'text-red-400'}`}>
                      {navigator.onLine ? '✓ 연결됨' : '✗ 오프라인'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Data Flow */}
          {activeTab === 'dataflow' && (
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3">📡 데이터 흐름도</h3>

                {/* Flow Diagram */}
                <div className="space-y-6">
                  {/* Step 1: API */}
                  <div className="relative">
                    <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-blue-400">1️⃣ API 데이터 수집</h4>
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500 text-green-400 text-xs rounded">
                          온라인
                        </span>
                      </div>
                      <ul className="space-y-1 text-sm text-white/80">
                        <li>• Binance API - RSI, MACD, BB (2초마다)</li>
                        <li>• Whale Alert WebSocket - 대형 거래 (실시간)</li>
                      </ul>
                    </div>
                    <div className="absolute left-1/2 -bottom-5 transform -translate-x-1/2">
                      <div className="text-2xl text-white/40">↓</div>
                    </div>
                  </div>

                  {/* Step 2: Backend Processing */}
                  <div className="relative mt-6">
                    <div className="bg-purple-500/10 border border-purple-500/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-purple-400">2️⃣ 백엔드 처리</h4>
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500 text-green-400 text-xs rounded">
                          실행 중
                        </span>
                      </div>
                      <ul className="space-y-1 text-sm text-white/80">
                        <li>• sentiment.js - RSI 평균 계산, MACD 크로스 감지</li>
                        <li>• alertSystem.js - 8개 시그널 조건 체크 (1분마다)</li>
                        <li>• whaleAlert.js - 거래 분류 (inflow/outflow/exchange)</li>
                      </ul>
                    </div>
                    <div className="absolute left-1/2 -bottom-5 transform -translate-x-1/2">
                      <div className="text-2xl text-white/40">↓</div>
                    </div>
                  </div>

                  {/* Step 3: Database */}
                  <div className="relative mt-6">
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-green-400">3️⃣ Supabase 저장</h4>
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500 text-green-400 text-xs rounded">
                          연결됨
                        </span>
                      </div>
                      <ul className="space-y-1 text-sm text-white/80">
                        <li>• market_sentiment 테이블 - RSI, MACD</li>
                        <li>• whale_events 테이블 - 대형 거래 내역</li>
                        <li>• alerts 테이블 - 발생한 알림</li>
                      </ul>
                    </div>
                    <div className="absolute left-1/2 -bottom-5 transform -translate-x-1/2">
                      <div className="text-2xl text-white/40">↓</div>
                    </div>
                  </div>

                  {/* Step 4: Frontend */}
                  <div className="mt-6">
                    <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-orange-400">4️⃣ 프론트엔드 표시</h4>
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500 text-green-400 text-xs rounded">
                          실시간
                        </span>
                      </div>
                      <ul className="space-y-1 text-sm text-white/80">
                        <li>• useSentiment() 훅 - Realtime 구독</li>
                        <li>• CurrentBar - RSI 기반 배경색</li>
                        <li>• WhaleCanvas - 고래 물리 엔진</li>
                        <li>• AlertDashboard - 알림 표시</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Update Frequencies */}
                <div className="mt-6 bg-gray-900/50 border border-white/10 rounded-lg p-4">
                  <h4 className="font-bold text-white mb-3">⏱️ 업데이트 주기</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">1h 타임프레임 감정</span>
                      <span className="font-mono text-white">2분마다</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">4h 타임프레임 감정</span>
                      <span className="font-mono text-white">8분마다</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">알림 시스템 체크</span>
                      <span className="font-mono text-white">1분마다</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">고래 거래</span>
                      <span className="font-mono text-white">실시간 (WebSocket)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">데이터베이스 정리</span>
                      <span className="font-mono text-white">매일 새벽 3시</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Signal Card Component
function SignalCard({ signal, tierColors }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      signal.active ? tierColors[signal.tier] : 'bg-gray-800/30 border-white/10'
    }`}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-bold ${tierColors[signal.tier]}`}>
              {signal.tier}
            </span>
            <span className="font-bold text-white">{signal.id}</span>
            <span className="text-sm text-white/60">{signal.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {signal.active && (
              <span className="px-2 py-1 bg-green-500/20 border border-green-500 text-green-400 text-xs rounded">
                ✓ 활성
              </span>
            )}
            <span className="text-2xl transform transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
              ▼
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-700/50 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                signal.active ? 'bg-green-500' : 'bg-blue-500/50'
              }`}
              style={{
                width: `${(parseInt(signal.conditionsMet.split('/')[0]) / parseInt(signal.conditionsMet.split('/')[1])) * 100}%`
              }}
            />
          </div>
          <span className="text-xs font-mono text-white/60">{signal.conditionsMet}</span>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 bg-black/20 space-y-2">
          {Object.entries(signal.conditions).map(([key, condition]) => (
            <div key={key} className="flex items-start gap-2 text-sm">
              <span className="text-lg leading-none">
                {condition.value ? '✓' : '✗'}
              </span>
              <div className="flex-1">
                <div className="text-white/80">{condition.description}</div>
                <div className="text-xs text-white/50 font-mono mt-0.5">
                  현재: {condition.current} {typeof condition.required !== 'boolean' && `• 필요: ${Array.isArray(condition.required) ? condition.required.join('-') : condition.required}`}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-sm text-white/80 font-medium">{signal.message}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DevDrawer
