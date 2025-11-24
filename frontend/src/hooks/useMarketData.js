import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { RSI, BollingerBands, MACD } from 'technicalindicators'

/**
 * Timeframe configuration for Binance API
 */
const TIME_FILTERS = {
  '1h': { interval: '1m', limit: 60 },
  '4h': { interval: '5m', limit: 48 },
  '8h': { interval: '15m', limit: 32 },
  '12h': { interval: '30m', limit: 24 },
  '1d': { interval: '1h', limit: 24 }
}

/**
 * Calculate bull/bear ratio from RSI (matching backend formula)
 * RSI 50 = neutral (50% bull, 50% bear)
 * RSI 100 = extreme bullish (100% bull, 0% bear)
 * RSI 0 = extreme bearish (0% bull, 100% bear)
 */
const calculateRatiosFromRSI = (rsi) => {
  const bull_ratio = rsi / 100 // 0-100 → 0-1
  const bear_ratio = 1 - bull_ratio
  return { bull_ratio, bear_ratio }
}

/**
 * Convert UI symbol to Binance trading pair
 * @param {string} symbol - UI symbol ('통합', 'BTC', 'ETH', 'XRP')
 * @returns {string} Binance trading pair (e.g., 'BTCUSDT')
 */
const convertSymbolToPair = (symbol) => {
  const mapping = {
    '통합': 'BTCUSDT', // Use BTC for combined view
    TOTAL: 'BTCUSDT',
    BTC: 'BTCUSDT',
    ETH: 'ETHUSDT',
    XRP: 'XRPUSDT'
  }
  return mapping[symbol] || 'BTCUSDT'
}

/**
 * Hook to fetch real-time market data from Binance API
 * Replaces TAAPI.io → Backend → DB → Frontend flow
 *
 * @param {string} timeframe - Timeframe ('1h', '4h', '8h', '12h', '1d')
 * @param {string} symbol - UI symbol ('통합', 'BTC', 'ETH', 'XRP') or Binance pair
 * @returns {object} Market data with RSI, BB, MACD, and sentiment ratios
 */
export function useMarketData(timeframe = '1h', symbol = '통합') {
  // Convert UI symbol to Binance trading pair
  const tradingPair = convertSymbolToPair(symbol)
  const [marketData, setMarketData] = useState({
    // Price data
    currentPrice: 0,
    current_price: 0, // Alias for AlertTerminal
    price_change_24h: 0,
    // RSI data (matching useSentiment structure)
    rsi_average: 50.0,
    rsi_btc: 50.0,
    rsi_oversold: false,
    rsi_overbought: false,
    // SWSI and ratios (calculated from RSI)
    swsi_score: 0,
    bull_ratio: 0.5,
    bear_ratio: 0.5,
    // MACD data
    macd_line: 0,
    macd_signal: 0,
    macd_histogram: 0,
    // Bollinger Bands
    bb_upper: 0,
    bb_middle: 0,
    bb_lower: 0,
    bb_width: 0,
    // Volume data
    volume_24h: 0,
    volume_change_24h: 0,
    currentVolume: 0,
    volStatus: 'NORMAL',
    volRatio: 1.0,
    volumeHistory: [],
    // Historical data
    history: [],
    // Metadata
    timeframe,
    symbol,
    loading: true,
    error: null,
    lastUpdate: null
  })

  const intervalRef = useRef(null)

  useEffect(() => {
    const config = TIME_FILTERS[timeframe]
    if (!config) {
      console.error(`❌ Invalid timeframe: ${timeframe}`)
      setMarketData((prev) => ({
        ...prev,
        loading: false,
        error: `Invalid timeframe: ${timeframe}`
      }))
      return
    }

    const fetchData = async () => {
      try {
        const response = await axios.get('https://api.binance.com/api/v3/klines', {
          params: { symbol: tradingPair, interval: config.interval, limit: 200 }
        })

        const closes = response.data.map((k) => parseFloat(k[4]))
        const volumes = response.data.map((k) => parseFloat(k[5]))
        const times = response.data.map((k) => k[0])

        // Calculate indicators using technicalindicators library
        const rsiResults = RSI.calculate({ values: closes, period: 14 })
        const bbResults = BollingerBands.calculate({
          values: closes,
          period: 20,
          stdDev: 2
        })
        const macdResults = MACD.calculate({
          values: closes,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
          SimpleMAOscillator: false,
          SimpleMASignal: false
        })

        // Synchronize data (최신순 정렬 - sync from latest data)
        const combinedData = []
        const limit = config.limit

        for (let i = 0; i < limit; i++) {
          // Access from end of arrays (latest data)
          const closeIdx = closes.length - 1 - i
          const rsiIdx = rsiResults.length - 1 - i
          const bbIdx = bbResults.length - 1 - i
          const macdIdx = macdResults.length - 1 - i

          // Only include data points where all indicators exist
          if (rsiIdx >= 0 && bbIdx >= 0 && macdIdx >= 0) {
            combinedData.push({
              time: times[closeIdx],
              price: closes[closeIdx],
              volume: volumes[closeIdx], // Add volume to combined data
              rsi: rsiResults[rsiIdx],
              bb: bbResults[bbIdx], // { middle, upper, lower }
              macd: macdResults[macdIdx] // { MACD, signal, histogram }
            })
          }
        }

        if (combinedData.length > 0) {
          const latest = combinedData[0]
          const oldest = combinedData[combinedData.length - 1]
          const { bull_ratio, bear_ratio } = calculateRatiosFromRSI(latest.rsi)

          // Calculate 24h price change percentage
          const price_change_24h = oldest?.price
            ? ((latest.price - oldest.price) / oldest.price) * 100
            : 0

          // Calculate BB Width as percentage of middle band (industry standard)
          // Formula: (Upper - Lower) / Middle × 100
          // This makes BB Width price-independent and timeframe-independent
          const bb_width_absolute = latest.bb.upper - latest.bb.lower
          const bb_width = (bb_width_absolute / latest.bb.middle) * 100

          // Calculate 24h volume (sum of recent volumes)
          const recentVolumes = volumes.slice(-config.limit)
          const volume_24h = recentVolumes.reduce((sum, v) => sum + v, 0)

          // Calculate volume change (compare recent vs previous period)
          const previousVolumes = volumes.slice(-config.limit * 2, -config.limit)
          const previousVolume = previousVolumes.length > 0
            ? previousVolumes.reduce((sum, v) => sum + v, 0)
            : volume_24h
          const volume_change_24h = previousVolume > 0
            ? ((volume_24h - previousVolume) / previousVolume) * 100
            : 0

          // Calculate Volume Status (EXPLOSIVE/ACTIVE/NORMAL/CALM)
          // Extract volumeHistory (최근 24개 캔들)
          const volumeHistory = combinedData.slice(0, 24).map(d => d.volume).reverse() // 오래된 순서로
          const currentVolume = latest.volume

          // Calculate average volume (최근 20개)
          const recentVolumesForAvg = combinedData.slice(0, 20).map(d => d.volume)
          const avgVolume = recentVolumesForAvg.reduce((sum, v) => sum + v, 0) / recentVolumesForAvg.length
          const volRatio = avgVolume > 0 ? currentVolume / avgVolume : 1.0

          // Determine volStatus based on ratio
          let volStatus = 'NORMAL'
          if (volRatio >= 2.0) {
            volStatus = 'EXPLOSIVE'
          } else if (volRatio >= 1.2) {
            volStatus = 'ACTIVE'
          } else if (volRatio >= 0.8) {
            volStatus = 'NORMAL'
          } else {
            volStatus = 'CALM'
          }

          // Normalize MACD histogram to percentage of price (timeframe-independent)
          // Formula: (Histogram / Current Price) × 100
          // This makes MACD comparable across all timeframes and price levels
          const macd_histogram_raw = latest.macd.histogram
          const macd_histogram = (macd_histogram_raw / latest.price) * 100

          setMarketData({
            currentPrice: latest.price,
            current_price: latest.price, // Alias for AlertTerminal
            price_change_24h,
            rsi_average: latest.rsi,
            rsi_btc: latest.rsi, // For BTC, average = btc
            rsi_oversold: latest.rsi < 30,
            rsi_overbought: latest.rsi > 70,
            swsi_score: (bull_ratio - 0.5) * 2, // Matching backend formula
            bull_ratio,
            bear_ratio,
            macd_line: latest.macd.MACD,
            macd_signal: latest.macd.signal,
            macd_histogram: macd_histogram, // Normalized percentage
            macd_histogram_raw: macd_histogram_raw, // Keep raw for debugging
            bb_upper: latest.bb.upper,
            bb_middle: latest.bb.middle,
            bb_lower: latest.bb.lower,
            bb_width,
            volume_24h,
            volume_change_24h,
            currentVolume,
            volStatus,
            volRatio: parseFloat(volRatio.toFixed(2)),
            volumeHistory,
            history: combinedData,
            timeframe,
            symbol,
            loading: false,
            error: null,
            lastUpdate: new Date().toISOString()
          })

          console.log(`📊 Market data updated (${timeframe}, ${symbol} → ${tradingPair}):`, {
            price: latest.price.toFixed(2),
            rsi: latest.rsi.toFixed(2),
            bull: (bull_ratio * 100).toFixed(1) + '%',
            macd_pct: macd_histogram.toFixed(3) + '%',
            bb_width_pct: bb_width.toFixed(2) + '%',
            vol_status: volStatus,
            vol_ratio: volRatio.toFixed(2) + 'x'
          })
        }
      } catch (error) {
        console.error('❌ CryptoDataEngine Error:', error)
        setMarketData((prev) => ({
          ...prev,
          loading: false,
          error: error.message
        }))
      }
    }

    // Initial fetch
    fetchData()

    // Set up 5-second polling interval (reduced API calls)
    intervalRef.current = setInterval(fetchData, 5000)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timeframe, symbol, tradingPair])

  return marketData
}
