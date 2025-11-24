/**
 * 🔱 SubMarine Alert Combo Data Transformer
 * Raw market data → ALERT_COMBOS condition format
 */

/**
 * Convert RSI value to 10-level classification
 * @param {number} rsi - RSI value (0-100)
 * @returns {{level: number, val: number}}
 */
export const getRSILevel = (rsi) => {
  let level
  if (rsi <= 10) level = 1
  else if (rsi <= 20) level = 2
  else if (rsi <= 30) level = 3
  else if (rsi <= 40) level = 4
  else if (rsi <= 50) level = 5
  else if (rsi <= 60) level = 6
  else if (rsi <= 70) level = 7
  else if (rsi <= 80) level = 8
  else if (rsi <= 90) level = 9
  else level = 10

  return { level, val: rsi }
}

/**
 * Convert BB width to 7-level classification + position
 * @param {object} sentiment - Market sentiment data
 * @returns {{widthLevel: number, position: string}}
 */
export const getBBData = (sentiment) => {
  const width = sentiment?.bb_width || 2.5
  const currentPrice = sentiment?.current_price || sentiment?.currentPrice || 0
  const upper = sentiment?.bb_upper || 0
  const middle = sentiment?.bb_middle || 0
  const lower = sentiment?.bb_lower || 0

  // Width level (1-7)
  let widthLevel
  if (width >= 8.0) widthLevel = 7
  else if (width >= 6.0) widthLevel = 6
  else if (width >= 4.0) widthLevel = 5
  else if (width >= 2.5) widthLevel = 4
  else if (width >= 1.5) widthLevel = 3
  else if (width >= 1.0) widthLevel = 2
  else widthLevel = 1

  // Position classification
  let position = 'MIDDLE'
  if (currentPrice > upper) {
    position = 'UPPER_BREAK' // 밴드 상단 돌파
  } else if (currentPrice > middle && currentPrice <= upper) {
    position = 'UPPER_ZONE' // 상단 밴드 근처
  } else if (currentPrice < lower) {
    position = 'LOWER_BREAK' // 밴드 하단 돌파
  } else if (currentPrice >= lower && currentPrice < middle) {
    position = 'LOWER_ZONE' // 하단 밴드 근처
  }

  return { widthLevel, position }
}

/**
 * Convert MACD to 7-level classification + status
 * @param {object} sentiment - Market sentiment data
 * @returns {{level: number, status: string}}
 */
export const getMACDData = (sentiment) => {
  const histogram = sentiment?.macd_histogram || 0 // Already normalized as %
  const macdLine = sentiment?.macd_line || 0
  const macdSignal = sentiment?.macd_signal || 0

  // Level (1-7)
  let level
  if (histogram >= 0.5) level = 7
  else if (histogram >= 0.2) level = 6
  else if (histogram >= 0.05) level = 5
  else if (histogram >= -0.05) level = 4
  else if (histogram >= -0.2) level = 3
  else if (histogram >= -0.5) level = 2
  else level = 1

  // Status
  let status = 'NEUTRAL'
  if (macdLine > macdSignal && histogram > 0) {
    status = 'GOLDEN' // 골든크로스 (상승 모멘텀)
  } else if (macdLine < macdSignal && histogram < 0) {
    status = 'DEAD' // 데드크로스 (하락 모멘텀)
  }

  return { level, status }
}

/**
 * Calculate time-weighted price change (matching whale data time window)
 * Uses same 6-hour window as whale time-weighting for temporal alignment
 * @param {object} sentiment - Market sentiment data with history
 * @param {number} timeWindowHours - Time window in hours (default: 6)
 * @returns {number|null} Price change percentage over time window, or null if insufficient data
 */
export const calculateTimeWeightedPriceChange = (sentiment, timeWindowHours = 6) => {
  const history = sentiment?.history
  if (!history || history.length === 0) return null

  const now = Date.now()
  const cutoff = now - (timeWindowHours * 60 * 60 * 1000)

  // Filter data within time window (history is sorted latest → oldest)
  const recentData = history.filter(d => d.time >= cutoff)

  if (recentData.length < 2) return null

  const latest = recentData[0]
  const oldest = recentData[recentData.length - 1]

  // Calculate simple price change over time window
  return ((latest.price - oldest.price) / oldest.price) * 100
}

/**
 * Transform whale data to combo format with time-weighted analysis
 * @param {Array} whales - Whale transaction data
 * @returns {{hasBuyFlow: boolean, hasSellFlow: boolean, maxTier: number, netFlow: number, buyTotal: number, sellTotal: number, buyRatio: number}}
 */
export const getWhaleData = (whales = []) => {
  if (!whales || whales.length === 0) {
    return {
      hasBuyFlow: false,
      hasSellFlow: false,
      maxTier: 0,
      netFlow: 0,
      buyTotal: 0,
      sellTotal: 0,
      buyRatio: 0
    }
  }

  const now = Date.now()
  let weightedBuyTotal = 0
  let weightedSellTotal = 0
  let maxTier = 0

  whales.forEach((whale) => {
    // Determine tier from amount_usd
    const amountUSD = whale.amount_usd || 0
    let tier = 1
    if (amountUSD >= 1000000000) tier = 7 // $1B+
    else if (amountUSD >= 500000000) tier = 6 // $500M-$1B
    else if (amountUSD >= 200000000) tier = 5 // $200M-$500M
    else if (amountUSD >= 100000000) tier = 4 // $100M-$200M
    else if (amountUSD >= 50000000) tier = 3 // $50M-$100M
    else if (amountUSD >= 20000000) tier = 2 // $20M-$50M
    else tier = 1 // $10M-$20M

    maxTier = Math.max(maxTier, tier)

    // Time-weighted calculation
    // Recent transactions have higher weight (exponential decay)
    const whaleTime = new Date(whale.timestamp).getTime()
    const ageHours = (now - whaleTime) / (60 * 60 * 1000)

    // Exponential decay: 6-hour half-life
    // 1h ago = 85%, 3h ago = 61%, 6h ago = 37%, 12h ago = 14%
    const weight = Math.exp(-ageHours / 6)

    const weightedAmount = amountUSD * weight

    // Determine flow direction with time weighting (2025-11-23: inflow/outflow terminology)
    // CRITICAL FIX: Only count 'inflow' and 'outflow' flows
    // Exclude 'exchange' (exchange-to-exchange transfers) and 'internal' (custody movements)
    // These are NOT market inflow/outflow signals
    if (whale.flow_type === 'inflow') {
      weightedBuyTotal += weightedAmount
    } else if (whale.flow_type === 'outflow') {
      weightedSellTotal += weightedAmount
    }
    // Note: 'exchange', 'internal', 'defi' flows are intentionally ignored
    // to prevent false signals from non-market movements
  })

  const netFlow = weightedBuyTotal - weightedSellTotal
  const totalFlow = weightedBuyTotal + weightedSellTotal

  // Buy ratio: -1 (all sell) to +1 (all buy)
  const buyRatio = totalFlow > 0
    ? (weightedBuyTotal - weightedSellTotal) / totalFlow
    : 0

  return {
    hasBuyFlow: weightedBuyTotal > 0,
    hasSellFlow: weightedSellTotal > 0,
    maxTier,
    netFlow,
    buyTotal: weightedBuyTotal,
    sellTotal: weightedSellTotal,
    buyRatio
  }
}

/**
 * Transform raw market data to ALERT_COMBOS condition format
 * @param {object} sentiment - Market sentiment from useMarketData
 * @param {Array} whales - Whale data from useWhaleData
 * @returns {object} Transformed data for ALERT_COMBOS conditions
 */
export const transformToComboData = (sentiment, whales) => {
  // Calculate time-weighted price change (6h window, matching whale data)
  const price_change_weighted = calculateTimeWeightedPriceChange(sentiment, 6)

  return {
    rsi: getRSILevel(sentiment?.rsi_average || 50),
    bb: getBBData(sentiment),
    macd: getMACDData(sentiment),
    whale: getWhaleData(whales),
    volume: {
      status: sentiment?.volStatus || 'NORMAL'
    },
    price_change_24h: sentiment?.price_change_24h || 0,
    price_change_weighted: price_change_weighted !== null ? price_change_weighted : sentiment?.price_change_24h || 0
  }
}
