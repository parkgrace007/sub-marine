import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_KEY = process.env.LUNARCRUSH_API_KEY
const BASE_URL = 'https://lunarcrush.com/api4'
const CACHE_DIR = path.join(__dirname, '../../cache')
const CACHE_FILE = path.join(CACHE_DIR, 'lunarcrush_cache.json')
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours (하루 3-4번 호출)

// Symbol to topic mapping
const SYMBOL_TO_TOPIC = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'XRP': 'ripple'
}

// Create cache directory if it doesn't exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

/**
 * Load cache from file
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
      const now = Date.now()

      // Check if cache is still valid
      if (data.timestamp && (now - data.timestamp) < CACHE_DURATION) {
        console.log('📦 Using cached LunarCrush data')
        return data
      }
      console.log('⏰ Cache expired, will fetch new data')
    }
  } catch (err) {
    console.error('❌ Error loading cache:', err.message)
  }
  return null
}

/**
 * Save cache to file
 */
function saveCache(data) {
  try {
    data.timestamp = Date.now()
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2))
    console.log('💾 Cached LunarCrush data')
  } catch (err) {
    console.error('❌ Error saving cache:', err.message)
  }
}

/**
 * Fetch news feeds from LunarCrush
 * @param {string} symbol - Crypto symbol (default: BTC)
 * @param {number} limit - Number of results (default: 10)
 */
async function fetchFeeds(symbol = 'BTC', limit = 10) {
  if (!API_KEY || API_KEY === 'YOUR_LUNARCRUSH_API_KEY_HERE') {
    console.warn('⚠️  LunarCrush API key not configured')
    return []
  }

  try {
    const topic = SYMBOL_TO_TOPIC[symbol] || symbol.toLowerCase()
    const url = `${BASE_URL}/public/topic/${topic}/news/v1?limit=${limit}`
    console.log(`🔍 Fetching LunarCrush news for ${topic}...`)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const json = await response.json()
    return json.data || []
  } catch (err) {
    console.error('❌ Error fetching feeds:', err.message)
    return []
  }
}

/**
 * Fetch top creators/influencers from LunarCrush
 * @param {string} symbol - Crypto symbol (default: BTC)
 * @param {number} limit - Number of results (default: 5)
 */
async function fetchInfluencers(symbol = 'BTC', limit = 5) {
  if (!API_KEY || API_KEY === 'YOUR_LUNARCRUSH_API_KEY_HERE') {
    console.warn('⚠️  LunarCrush API key not configured')
    return []
  }

  try {
    const topic = SYMBOL_TO_TOPIC[symbol] || symbol.toLowerCase()
    const url = `${BASE_URL}/public/topic/${topic}/creators/v1?limit=${limit}`
    console.log(`🔍 Fetching LunarCrush creators for ${topic}...`)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const json = await response.json()
    return json.data || []
  } catch (err) {
    console.error('❌ Error fetching influencers:', err.message)
    return []
  }
}

/**
 * Get all data (news + influencers) with caching
 * @param {string} symbol - Crypto symbol (default: BTC)
 * @param {boolean} forceRefresh - Force API call even if cache exists
 */
export async function getLunarCrushData(symbol = 'BTC', forceRefresh = false) {
  // Try to load from cache first
  if (!forceRefresh) {
    const cached = loadCache()
    if (cached && cached.symbol === symbol) {
      return cached
    }
  }

  // Fetch new data from API
  console.log('🌙 Fetching fresh data from LunarCrush API...')

  const [feeds, influencers] = await Promise.all([
    fetchFeeds(symbol, 10),
    fetchInfluencers(symbol, 5)
  ])

  const data = {
    symbol,
    feeds,
    influencers,
    timestamp: Date.now(),
    lastUpdate: new Date().toISOString()
  }

  // Save to cache
  saveCache(data)

  return data
}

/**
 * Clear cache (for manual refresh)
 */
export function clearCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE)
      console.log('🗑️  Cache cleared')
      return true
    }
  } catch (err) {
    console.error('❌ Error clearing cache:', err.message)
  }
  return false
}

export default {
  getLunarCrushData,
  clearCache
}
