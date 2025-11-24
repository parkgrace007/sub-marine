import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * useNews - Custom hook for fetching crypto news from Supabase
 * @param {boolean} autoLoad - Auto-load data on mount (default: true)
 * @returns {Object} { data, loading, error }
 */
export function useNews(autoLoad = true) {
  const [data, setData] = useState({
    articles: [],
    lastUpdate: null,
    totalResults: 0,
    nextRefresh: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Fetch news from backend (always from Supabase cache)
   */
  const fetchNews = async () => {
    setLoading(true)
    setError(null)

    try {
      const url = `${API_URL}/api/news`
      console.log(`📰 Fetching news from: ${url}`)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch news')
      }

      console.log(`✅ Loaded ${json.data.articles.length} news articles`)

      setData({
        articles: json.data.articles || [],
        lastUpdate: json.data.lastUpdate,
        totalResults: json.data.totalResults || 0,
        nextRefresh: json.nextRefresh
      })
    } catch (err) {
      console.error('❌ Error fetching news:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      fetchNews()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error
  }
}

export default useNews
