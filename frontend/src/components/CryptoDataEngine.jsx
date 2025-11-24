import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { RSI, BollingerBands, MACD } from 'technicalindicators'

const TIME_FILTERS = {
  '1h': { interval: '1m', limit: 60 },
  '4h': { interval: '5m', limit: 48 },
  '8h': { interval: '15m', limit: 32 },
  '12h': { interval: '30m', limit: 24 },
  '1d': { interval: '1h', limit: 24 }
}

const CryptoDataEngine = ({ timeframe = '1d', onDataUpdate }) => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const config = TIME_FILTERS[timeframe];
      const response = await axios.get('https://api.binance.com/api/v3/klines', {
        params: { symbol: 'BTCUSDT', interval: config.interval, limit: 200 }
      });

      const closes = response.data.map((k) => parseFloat(k[4]))
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

      // Data synchronization (최신순 정렬 - sync from latest data)
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
            rsi: rsiResults[rsiIdx],
            bb: bbResults[bbIdx], // { middle, upper, lower }
            macd: macdResults[macdIdx] // { MACD, signal, histogram }
          })
        }
      }

      if (combinedData.length > 0) {
        const newData = {
          currentPrice: closes[closes.length - 1],
          lastRsi: combinedData[0].rsi,
          lastMacd: combinedData[0].macd,
          history: combinedData
        }
        setMarketData(newData)

        // Call parent callback if provided
        if (onDataUpdate) {
          onDataUpdate(newData)
        }
      }
    } catch (error) {
      console.error('CryptoDataEngine Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [timeframe])

  // This component doesn't render anything - it's a data provider
  return null
}

export default CryptoDataEngine
