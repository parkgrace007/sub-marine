/**
 * useIndicatorLogger.js - Real-time Indicator Change Detection Hook
 *
 * Purpose: Monitor RSI, MACD, BB indicators and generate logs on changes
 * Uses: useMarketData for real-time data, logGenerator for template-based logs
 * Supports bilingual output (ko/en) based on current i18n language
 */

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMarketData } from './useMarketData'
import {
  generateRSILog,
  generateMACDLog,
  generateBBLog
} from '../utils/logGenerator'

/**
 * Hook to monitor indicators and generate logs on changes
 *
 * @param {string} timeframe - Timeframe ('1h', '4h', '8h', '12h', '1d')
 * @param {string} symbol - Trading symbol ('통합', 'BTC', 'ETH', 'XRP')
 * @param {function} onLogGenerated - Callback (log) => void
 * @returns {object} Market data from useMarketData
 */
export function useIndicatorLogger(timeframe = '1h', symbol = '통합', onLogGenerated) {
  const { i18n } = useTranslation()
  // Get current language ('ko' or 'en')
  const lang = i18n.language === 'en' || i18n.language?.startsWith('en-') ? 'en' : 'ko'

  // Subscribe to real-time market data
  const marketData = useMarketData(timeframe, symbol)

  // Store previous values for change detection
  const prevValuesRef = useRef({
    rsi: null,
    macdHistogram: null,
    macdLine: null,
    bbWidth: null,
    bbPosition: null,
    initialized: false
  })

  // Monitor RSI changes
  useEffect(() => {
    if (marketData.loading || marketData.error) return
    if (marketData.rsi_average === null || marketData.rsi_average === undefined) return
    if (isNaN(marketData.rsi_average)) return

    const currentRSI = marketData.rsi_average
    const prevRSI = prevValuesRef.current.rsi

    // Skip first run (no previous value to compare)
    if (prevRSI !== null && prevValuesRef.current.initialized) {
      const log = generateRSILog(currentRSI, prevRSI, lang)
      if (log && onLogGenerated) {
        onLogGenerated(log)
      }
    }

    // Update previous value
    prevValuesRef.current.rsi = currentRSI
  }, [marketData.rsi_average, marketData.loading, marketData.error, onLogGenerated, lang])

  // Monitor MACD changes
  useEffect(() => {
    if (marketData.loading || marketData.error) return
    if (marketData.macd_histogram === null || marketData.macd_histogram === undefined) return
    if (isNaN(marketData.macd_histogram)) return

    const currentHistogram = marketData.macd_histogram
    const currentMacdLine = marketData.macd_line || null
    const prevHistogram = prevValuesRef.current.macdHistogram
    const prevMacdLine = prevValuesRef.current.macdLine

    // Skip first run
    if (prevHistogram !== null && prevValuesRef.current.initialized) {
      const log = generateMACDLog(currentHistogram, prevHistogram, currentMacdLine, prevMacdLine, lang)
      if (log && onLogGenerated) {
        onLogGenerated(log)
      }
    }

    // Update previous values
    prevValuesRef.current.macdHistogram = currentHistogram
    prevValuesRef.current.macdLine = currentMacdLine
  }, [
    marketData.macd_histogram,
    marketData.macd_line,
    marketData.loading,
    marketData.error,
    onLogGenerated,
    lang
  ])

  // Monitor Bollinger Bands changes
  useEffect(() => {
    if (marketData.loading || marketData.error) return
    if (marketData.bb_width === null || marketData.bb_width === undefined) return
    if (isNaN(marketData.bb_width)) return

    const currentWidth = marketData.bb_width
    const prevWidth = prevValuesRef.current.bbWidth

    // Position data
    const currentPosition = marketData.currentPrice && marketData.bb_upper && marketData.bb_lower
      ? {
          price: marketData.currentPrice,
          upper: marketData.bb_upper,
          middle: marketData.bb_middle,
          lower: marketData.bb_lower
        }
      : null

    const prevPosition = prevValuesRef.current.bbPosition

    // Skip first run
    if (prevWidth !== null && prevValuesRef.current.initialized) {
      const log = generateBBLog(currentWidth, prevWidth, currentPosition, prevPosition, lang)
      if (log && onLogGenerated) {
        onLogGenerated(log)
      }
    }

    // Update previous values
    prevValuesRef.current.bbWidth = currentWidth
    prevValuesRef.current.bbPosition = currentPosition
  }, [
    marketData.bb_width,
    marketData.currentPrice,
    marketData.bb_upper,
    marketData.bb_middle,
    marketData.bb_lower,
    marketData.loading,
    marketData.error,
    onLogGenerated,
    lang
  ])

  // Mark as initialized after first data load
  useEffect(() => {
    if (!marketData.loading && !marketData.error && marketData.rsi_average !== null) {
      // Delay initialization to ensure all values are set
      const timer = setTimeout(() => {
        prevValuesRef.current.initialized = true
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [marketData.loading, marketData.error, marketData.rsi_average])

  return marketData
}
