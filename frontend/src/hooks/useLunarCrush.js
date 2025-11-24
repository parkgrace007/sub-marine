import { useState, useEffect } from 'react'

// API URL from environment variable or fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Custom hook for fetching LunarCrush news and influencer data
 * @param {string} symbol - Crypto symbol (default: 'BTC')
 * @param {boolean} autoFetch - Auto-fetch on mount (default: true)
 * @returns {object} - { data, loading, error, refresh }
 */
export function useLunarCrush(symbol = 'BTC', autoFetch = true) {
  const [data, setData] = useState({ feeds: [], influencers: [], lastUpdate: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      const url = `${API_URL}/api/lunarcrush/news?symbol=${symbol}${forceRefresh ? '&refresh=true' : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()

      if (json.success) {
        setData(json.data)
        console.log(`✅ LunarCrush data loaded (${json.data.feeds.length} feeds, ${json.data.influencers.length} influencers)`)
        if (json.cached) {
          console.log(`📦 Using cached data (${Math.floor(json.cacheAge / 60)} minutes old)`)
        }
      } else {
        throw new Error(json.message || 'Failed to fetch data')
      }
    } catch (err) {
      console.error('❌ LunarCrush fetch error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [symbol, autoFetch])

  return {
    data,
    loading,
    error,
    refresh: () => fetchData(true)
  }
}

export default useLunarCrush
