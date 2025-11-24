import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

// API URL from environment variable or fallback to localhost for development
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const POLL_INTERVAL_MS = 5 * 60 * 1000 // Poll every 5 minutes (backend has 15-minute cache)

/**
 * useCryptoTrends - Fetch real-time crypto news trends from CryptoPanic API
 *
 * Fetches "Rising" crypto news/tweets from backend API (with 15-minute cache)
 * Polls every 5 minutes for client-side updates (reduced to avoid rate limiting)
 *
 * @returns {{posts: Array, loading: boolean, error: string|null, cached: boolean, cacheAge: number}}
 */
export function useCryptoTrends() {
  const [trendsData, setTrendsData] = useState({
    posts: [],
    loading: true,
    error: null,
    cached: false,
    cacheAge: 0
  })

  const intervalRef = useRef(null)

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/crypto-trends`, {
          timeout: 10000 // 10 second timeout
        })

        if (response.data.success) {
          setTrendsData({
            posts: response.data.data.posts || [],
            loading: false,
            error: null,
            cached: response.data.cached || false,
            cacheAge: response.data.cacheAge || 0
          })
        } else {
          setTrendsData(prev => ({
            ...prev,
            loading: false,
            error: response.data.error || 'Unknown error'
          }))
        }
      } catch (error) {
        console.error('❌ CryptoPanic trends fetch error:', error.message)
        setTrendsData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
      }
    }

    // Initial fetch
    fetchTrends()

    // Poll every 5 minutes (reduced to match backend cache and avoid rate limiting)
    intervalRef.current = setInterval(fetchTrends, POLL_INTERVAL_MS)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, []) // Run once on mount

  return trendsData
}

export default useCryptoTrends
