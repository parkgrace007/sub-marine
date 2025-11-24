import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

dotenv.config()

const API_KEY = process.env.NEWSAPI_KEY
const BASE_URL = 'https://newsapi.org/v2'

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Anthropic Claude for translation
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Crypto-related keywords for NewsAPI
const CRYPTO_KEYWORDS = [
  'bitcoin',
  'cryptocurrency',
  'crypto',
  'ethereum',
  'blockchain',
  'BTC',
  'ETH',
  'XRP',
  'altcoin',
  'DeFi',
  'NFT'
].join(' OR ')

// Max articles to store in Supabase
const MAX_ARTICLES = 40

// Crypto relevance keywords (for filtering)
const MUST_HAVE_KEYWORDS = [
  // Core crypto terms
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency',
  'blockchain', 'defi', 'nft', 'altcoin', 'token', 'coin',
  // Major coins
  'xrp', 'ripple', 'bnb', 'binance', 'cardano', 'ada', 'solana', 'sol',
  'polygon', 'matic', 'dogecoin', 'doge', 'shiba',
  // Crypto ecosystem
  'coinbase', 'kraken', 'exchange', 'wallet', 'mining', 'miner',
  'satoshi', 'halving', 'staking', 'yield', 'dex', 'dao',
  'web3', 'metaverse', 'smart contract', 'gas fee', 'layer 2',
  // Trading terms
  'bull market', 'bear market', 'hodl', 'fud', 'fomo', 'whale alert'
]

const EXCLUDE_KEYWORDS = [
  // Entertainment (MOST IMPORTANT - main source of false positives)
  // NOTE: Removed 'doc' (too generic, blocks "crypto documentation") and 'runway' (blocks "Bitcoin runway extended")
  'movie', 'film', 'cinema', 'documentary', 'docuseries',
  'actor', 'actress', 'director', 'producer', 'screenplay', 'filmmaker',
  'celebrity', 'hollywood', 'bollywood', 'showbiz',
  'netflix', 'hulu', 'disney+', 'disney plus', 'amazon prime', 'hbo', 'streaming service',
  'tv show', 'television', 'series premiere', 'season finale', 'episode',
  'music', 'album', 'concert', 'tour', 'singer', 'band', 'musician', 'rapper', 'artist',
  'grammy', 'oscar', 'emmy', 'golden globe', 'award show', 'red carpet',
  'jordan peele', 'high horse', 'black cowboy', 'western movie', 'cowboy movie',
  'comedy', 'drama', 'thriller', 'horror', 'romance', 'animation',
  'box office', 'premiere', 'trailer', 'casting', 'audition',

  // Sports
  'football', 'soccer', 'nfl', 'nba', 'mlb', 'nhl', 'hockey', 'tennis',
  'olympics', 'championship', 'tournament', 'league', 'playoffs', 'superbowl',
  'world cup', 'uefa', 'premier league', 'la liga', 'serie a', 'bundesliga',
  'formula 1', 'f1', 'nascar', 'racing', 'motorsport',
  'boxing', 'mma', 'ufc', 'wrestling', 'wwe',
  'golf', 'baseball', 'basketball', 'volleyball', 'badminton',
  'athlete', 'coach', 'player', 'team roster', 'draft pick',

  // Politics (unless explicitly crypto-related)
  'election', 'vote', 'voting', 'senate', 'congress', 'democrat', 'republican',
  'white house', 'president biden', 'donald trump', 'kamala harris',
  'campaign', 'primary', 'midterm', 'poll', 'ballot', 'governor',

  // Weather & Natural Disasters
  'weather', 'forecast', 'hurricane', 'typhoon', 'earthquake', 'tsunami',
  'flood', 'flooding', 'landslide', 'wildfire', 'tornado', 'storm',
  'climate change', 'global warming', 'drought',

  // Food & Lifestyle
  'recipe', 'cooking', 'restaurant', 'chef', 'food review', 'culinary',
  'diet', 'nutrition', 'weight loss', 'fitness', 'workout', 'gym',
  'fashion show', 'fashion designer', 'fashion runway', 'vogue', 'fashion style', 'clothing line',
  'beauty', 'makeup', 'cosmetics', 'skincare',

  // Travel & Real Estate
  'travel', 'vacation', 'hotel', 'airline', 'tourism', 'destination',
  'real estate', 'property', 'mortgage', 'housing market', 'rent',

  // Automotive
  'car review', 'vehicle', 'automotive', 'test drive', 'auto show',

  // Health & Medical
  'health', 'medical', 'disease', 'vaccine', 'vaccination', 'doctor', 'hospital',
  'surgery', 'treatment', 'diagnosis', 'patient', 'clinical trial',

  // Books & Literature
  'book review', 'novel', 'author', 'bestseller', 'publishing', 'writer',
  'memoir', 'biography', 'literature',

  // Technology (non-crypto)
  'gaming console', 'playstation', 'xbox', 'nintendo', 'ps5',
  'smartphone review', 'iphone review', 'android review', 'gadget review',

  // History & Education
  'erased part of history', 'historical', 'sheds light on', 'documentary about',
  'explores the history', 'tells the story'
]

/**
 * Test if a single article passes crypto filter (reusable logic)
 * @param {Object} article - Article object with title, description, content, publishedAt
 * @returns {Object} { passed: boolean, reason: string, cryptoKeywordCount?: number }
 */
function testArticleAgainstFilter(article) {
  const title = (article.title || '').toLowerCase()
  const description = (article.description || '').toLowerCase()
  const content = (article.content || '').toLowerCase()
  const fullText = `${title} ${description} ${content}`

  // PRIORITY 1: Title check (strongest signal)
  const titleHasExclude = EXCLUDE_KEYWORDS.some(keyword => title.includes(keyword))
  if (titleHasExclude) {
    const matchedKeyword = EXCLUDE_KEYWORDS.find(keyword => title.includes(keyword))
    return { passed: false, reason: `title contains "${matchedKeyword}"` }
  }

  // PRIORITY 2: Full text check for excluded keywords
  const hasExcludedKeyword = EXCLUDE_KEYWORDS.some(keyword => fullText.includes(keyword))
  if (hasExcludedKeyword) {
    const matchedKeyword = EXCLUDE_KEYWORDS.find(keyword => fullText.includes(keyword))
    return { passed: false, reason: `contains "${matchedKeyword}"` }
  }

  // Calculate article age for time-weighted filtering
  const publishedAt = article.publishedAt ? new Date(article.publishedAt) : new Date()
  const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60)

  // PRIORITY 3: Must have crypto keywords (time-weighted: 6h window gets lenient filtering)
  const cryptoKeywordCount = MUST_HAVE_KEYWORDS.filter(keyword => fullText.includes(keyword)).length

  // Fresh articles (within 6 hours): Only need 1+ keyword (more lenient for breaking news)
  if (ageHours <= 6 && cryptoKeywordCount >= 1) {
    return {
      passed: true,
      reason: `🔥 fresh (${ageHours.toFixed(1)}h) with ${cryptoKeywordCount} keyword(s)`,
      cryptoKeywordCount
    }
  }

  // Older articles: Need 2+ keywords (strict filtering)
  if (cryptoKeywordCount < 2) {
    return { passed: false, reason: `only ${cryptoKeywordCount} crypto keyword, need 2+` }
  }

  // PRIORITY 4: Keyword density (stricter: 2% instead of 1%)
  const wordCount = fullText.split(/\s+/).length
  const keywordDensity = cryptoKeywordCount / wordCount
  if (keywordDensity < 0.02) {
    return { passed: false, reason: `low density: ${(keywordDensity * 100).toFixed(2)}%, need 2%+` }
  }

  // PRIORITY 5: Title should contain at least 1 crypto keyword (bonus check)
  const titleHasCrypto = MUST_HAVE_KEYWORDS.some(keyword => title.includes(keyword))
  if (!titleHasCrypto) {
    return { passed: false, reason: 'no crypto keyword in title' }
  }

  return {
    passed: true,
    reason: `${cryptoKeywordCount} keywords, ${(keywordDensity * 100).toFixed(2)}% density`,
    cryptoKeywordCount
  }
}

/**
 * Filter articles to only include crypto-related content
 * @param {Array} articles - Articles from NewsAPI
 * @returns {Array} Filtered crypto-related articles
 */
function filterCryptoRelatedArticles(articles) {
  const filtered = articles.filter(article => {
    const result = testArticleAgainstFilter(article)

    if (result.passed) {
      console.log(`✅ Included: "${article.title}" (${result.reason})`)
    } else {
      console.log(`⛔ Excluded: "${article.title}" (${result.reason})`)
    }

    return result.passed
  })

  console.log(`\n🔍 Filter Summary:`)
  console.log(`   Input: ${articles.length} articles`)
  console.log(`   Output: ${filtered.length} crypto-related (${((filtered.length/articles.length)*100).toFixed(1)}%)`)
  console.log(`   Rejected: ${articles.length - filtered.length}\n`)

  return filtered
}

/**
 * Fetch crypto news from NewsAPI.org
 * @param {number} pageSize - Number of articles (default: 40, will be filtered)
 */
async function fetchCryptoNews(pageSize = 40) {
  if (!API_KEY || API_KEY === 'YOUR_NEWSAPI_KEY_HERE') {
    console.warn('⚠️  NewsAPI key not configured')
    return []
  }

  try {
    // Fetch only articles from the last 6 hours (ultra-fresh news)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
    const from = sixHoursAgo.toISOString()

    const url = `${BASE_URL}/everything?q=${encodeURIComponent(CRYPTO_KEYWORDS)}&from=${from}&language=en&sortBy=publishedAt&pageSize=${pageSize}`
    console.log(`🔍 Fetching crypto news from last 6 hours...`)

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const json = await response.json()

    if (json.status === 'error') {
      throw new Error(json.message || 'Unknown API error')
    }

    console.log(`✅ Fetched ${json.articles?.length || 0} articles from NewsAPI`)
    return json.articles || []
  } catch (err) {
    console.error('❌ Error fetching news:', err.message)
    return []
  }
}

/**
 * Detect crypto-related tags from article content
 */
function detectTags(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase()
  const tags = []

  if (text.includes('bitcoin') || text.includes('btc')) tags.push('BTC')
  if (text.includes('ethereum') || text.includes('eth')) tags.push('ETH')
  if (text.includes('ripple') || text.includes('xrp')) tags.push('XRP')
  if (text.includes('defi') || text.includes('decentralized finance')) tags.push('DeFi')
  if (text.includes('nft') || text.includes('non-fungible')) tags.push('NFT')
  if (text.includes('altcoin') || text.includes('alt coin')) tags.push('Altcoin')

  return tags
}

/**
 * Estimate reading time based on content length
 */
function estimateReadTime(content = '') {
  const words = content.split(/\s+/).length
  const minutes = Math.ceil(words / 200) // Average 200 words/min
  return minutes
}

/**
 * Translate articles to Korean using Claude
 * @param {Array} articles - Array of articles to translate
 */
async function translateArticles(articles) {
  if (!process.env.ANTHROPIC_API_KEY || articles.length === 0) {
    console.warn('⚠️  Translation skipped: No API key or no articles')
    return articles
  }

  try {
    console.log(`🌐 Translating ${articles.length} articles to Korean...`)

    // Prepare batch translation prompt
    const articlesForTranslation = articles.map((article, index) => ({
      index,
      title: article.title,
      description: article.description || article.content?.substring(0, 500)
    }))

    const prompt = `다음 암호화폐 뉴스 기사들을 자연스러운 한국어로 번역해주세요.
각 기사의 제목과 요약을 번역하되, 전문 용어는 적절히 한국어화하되 괄호 안에 영문을 병기해주세요.
예: Bitcoin → 비트코인(Bitcoin), Ethereum → 이더리움(Ethereum)

JSON 형식으로 응답해주세요:
[
  {
    "index": 0,
    "title": "번역된 제목",
    "description": "번역된 요약"
  },
  ...
]

번역할 기사들:
${JSON.stringify(articlesForTranslation, null, 2)}`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    // Parse translated content
    const translatedText = message.content[0].text
    const translated = JSON.parse(translatedText)

    console.log(`✅ Translated ${translated.length} articles`)

    // Apply translations back to articles (preserve originals)
    return articles.map((article, index) => {
      const translation = translated.find(t => t.index === index)
      if (translation) {
        return {
          ...article,
          title_en: article.title,          // Save original English title
          description_en: article.description, // Save original English description
          title: translation.title,          // Korean translated title
          description: translation.description // Korean translated description
        }
      }
      return article
    })
  } catch (err) {
    console.error('❌ Translation error:', err.message)
    // Return original articles if translation fails
    return articles
  }
}

/**
 * Save translated articles to Supabase
 * @param {Array} articles - Translated articles
 */
async function saveToSupabase(articles) {
  if (articles.length === 0) {
    console.log('⏭️  No new articles to save')
    return
  }

  try {
    console.log(`💾 Saving ${articles.length} articles to Supabase...`)

    const records = articles.map(article => ({
      url: article.url,
      title: article.title,
      body: article.description,
      title_en: article.title_en,
      body_en: article.description_en,
      publisher_name: article.source?.name || 'Unknown',
      image: article.urlToImage,
      author: article.author,
      tags: detectTags(article.title, article.description),
      read_time: estimateReadTime(article.content || article.description),
      published_at: article.publishedAt
    }))

    const { error } = await supabase
      .from('translated_news')
      .upsert(records, { onConflict: 'url' })

    if (error) throw error

    console.log(`✅ Saved ${articles.length} articles`)

    // Cleanup: Keep only the latest MAX_ARTICLES
    await cleanupOldArticles()
  } catch (err) {
    console.error('❌ Error saving to Supabase:', err.message)
  }
}

/**
 * Delete old articles to maintain MAX_ARTICLES limit
 */
async function cleanupOldArticles() {
  try {
    // Count total articles
    const { count, error: countError } = await supabase
      .from('translated_news')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    if (count > MAX_ARTICLES) {
      const deleteCount = count - MAX_ARTICLES
      console.log(`🗑️  Deleting ${deleteCount} old articles (limit: ${MAX_ARTICLES})...`)

      // Get IDs of oldest articles
      const { data: oldArticles, error: selectError } = await supabase
        .from('translated_news')
        .select('id')
        .order('published_at', { ascending: true })
        .limit(deleteCount)

      if (selectError) throw selectError

      const idsToDelete = oldArticles.map(a => a.id)

      const { error: deleteError } = await supabase
        .from('translated_news')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) throw deleteError

      console.log(`✅ Deleted ${deleteCount} old articles`)
    }
  } catch (err) {
    console.error('❌ Error cleaning up old articles:', err.message)
  }
}

/**
 * Clean up existing database articles using enhanced crypto filter
 * Run this ONCE after deploying enhanced filter to remove non-crypto articles
 * @returns {Object} { total: number, deleted: number, deletedArticles: Array }
 */
export async function cleanupExistingArticles() {
  try {
    console.log('🧹 Starting database cleanup with enhanced crypto filter...\n')

    // Fetch all articles from database
    const { data: allArticles, error } = await supabase
      .from('translated_news')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) throw error

    console.log(`📦 Found ${allArticles.length} total articles in database\n`)

    const toDelete = []

    // Test each article against new enhanced filter
    for (const article of allArticles) {
      // Use English version if available, fallback to translated version
      const testArticle = {
        title: article.title_en || article.title,
        description: article.body_en || article.body,
        content: article.body_en || article.body,
        url: article.url
      }

      const result = testArticleAgainstFilter(testArticle)

      if (!result.passed) {
        toDelete.push({
          id: article.id,
          title: article.title,
          reason: result.reason
        })
        console.log(`❌ Will delete: "${article.title}"`)
        console.log(`   Reason: ${result.reason}`)
        console.log(`   URL: ${article.url}\n`)
      } else {
        console.log(`✅ Will keep: "${article.title}"`)
        console.log(`   Reason: ${result.reason}\n`)
      }
    }

    // Delete non-crypto articles from database
    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${toDelete.length} non-crypto articles...`)

      const idsToDelete = toDelete.map(a => a.id)
      const { error: deleteError } = await supabase
        .from('translated_news')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) throw deleteError

      console.log(`✅ Successfully deleted ${toDelete.length} non-crypto articles\n`)
    } else {
      console.log(`✅ All articles are crypto-related - no cleanup needed!\n`)
    }

    // Summary
    const summary = {
      total: allArticles.length,
      deleted: toDelete.length,
      kept: allArticles.length - toDelete.length,
      deletedArticles: toDelete.map(a => ({ title: a.title, reason: a.reason }))
    }

    console.log(`📊 Cleanup Summary:`)
    console.log(`   Total articles: ${summary.total}`)
    console.log(`   Deleted: ${summary.deleted}`)
    console.log(`   Kept: ${summary.kept}`)
    console.log(`   Success rate: ${((summary.kept / summary.total) * 100).toFixed(1)}%\n`)

    return summary
  } catch (err) {
    console.error('❌ Error cleaning up existing articles:', err.message)
    throw err
  }
}

/**
 * Get latest news articles (from Supabase or fetch new ones)
 * @param {boolean} forceRefresh - Force fetching new articles and translating
 */
export async function getNewsAPIData(forceRefresh = false) {
  try {
    // If not forcing refresh, return existing articles from Supabase
    if (!forceRefresh) {
      const { data, error } = await supabase
        .from('translated_news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20)

      if (error) throw error

      if (data && data.length > 0) {
        console.log(`📦 Returning ${data.length} cached articles from Supabase`)

        return {
          articles: data.map(item => ({
            title: item.title,
            body: item.body,
            url: item.url,
            created: new Date(item.published_at).getTime(),
            publisher_name: item.publisher_name,
            image: item.image,
            author: item.author,
            tags: item.tags || [],
            readTime: item.read_time
          })),
          timestamp: Date.now(),
          lastUpdate: new Date().toISOString(),
          totalResults: data.length
        }
      }
    }

    // Fetch fresh data from NewsAPI
    console.log('🌐 Fetching fresh data from NewsAPI.org...')

    const freshArticles = await fetchCryptoNews(40) // Fetch more since we'll filter

    if (freshArticles.length === 0) {
      console.log('⚠️  No articles fetched from NewsAPI')
      return {
        articles: [],
        timestamp: Date.now(),
        lastUpdate: new Date().toISOString(),
        totalResults: 0
      }
    }

    // Filter to only crypto-related articles
    const cryptoArticles = filterCryptoRelatedArticles(freshArticles)

    if (cryptoArticles.length === 0) {
      console.log('⚠️  No crypto-related articles after filtering')
      return {
        articles: [],
        timestamp: Date.now(),
        lastUpdate: new Date().toISOString(),
        totalResults: 0
      }
    }

    // Check existing articles in database (with translation status)
    const { data: existingArticles, error: fetchError } = await supabase
      .from('translated_news')
      .select('url, title, title_en')

    if (fetchError) {
      console.error('❌ Error fetching existing articles:', fetchError.message)
      return {
        articles: [],
        timestamp: Date.now(),
        lastUpdate: new Date().toISOString(),
        totalResults: 0
      }
    }

    const existingURLs = new Set(existingArticles.map(a => a.url))

    // Find articles that need translation:
    // 1. New articles (not in DB)
    // 2. Existing articles with English titles (need retranslation)
    const untranslatedURLs = new Set(
      existingArticles
        .filter(a => {
          // If no title_en field, it's not properly translated
          if (!a.title_en) return true
          // If title is empty or English (ASCII), needs translation
          if (!a.title || a.title.length === 0) return true
          // Check if first character is ASCII (English) - needs translation
          return a.title.charCodeAt(0) < 128
        })
        .map(a => a.url)
    )

    const articlesToTranslate = cryptoArticles.filter(a =>
      !existingURLs.has(a.url) || untranslatedURLs.has(a.url)
    )

    const newCount = cryptoArticles.filter(a => !existingURLs.has(a.url)).length
    const retranslateCount = articlesToTranslate.length - newCount

    console.log(`📊 Fresh: ${freshArticles.length}, Crypto-related: ${cryptoArticles.length}`)
    console.log(`   New: ${newCount}, Need retranslation: ${retranslateCount}, Already translated: ${cryptoArticles.length - articlesToTranslate.length}`)

    // Translate articles (new + untranslated)
    if (articlesToTranslate.length > 0) {
      console.log(`🌐 Translating ${articlesToTranslate.length} articles to Korean...`)
      const translated = await translateArticles(articlesToTranslate)
      // translated already contains both Korean (title/description) and English (title_en/description_en)
      await saveToSupabase(translated)
    } else {
      console.log('✅ All articles already translated - no API calls needed!')
    }

    // Return latest 20 articles from Supabase
    const { data, error } = await supabase
      .from('translated_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return {
      articles: data.map(item => ({
        title: item.title,
        body: item.body,
        url: item.url,
        created: new Date(item.published_at).getTime(),
        publisher_name: item.publisher_name,
        image: item.image,
        author: item.author,
        tags: item.tags || [],
        readTime: item.read_time
      })),
      timestamp: Date.now(),
      lastUpdate: new Date().toISOString(),
      totalResults: data.length
    }
  } catch (err) {
    console.error('❌ Error in getNewsAPIData:', err.message)
    return {
      articles: [],
      timestamp: Date.now(),
      lastUpdate: new Date().toISOString(),
      totalResults: 0
    }
  }
}

/**
 * Clear all translated news from Supabase
 */
export async function clearCache() {
  try {
    const { error } = await supabase
      .from('translated_news')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (error) throw error

    console.log('🗑️  All translated news cleared from Supabase')
    return true
  } catch (err) {
    console.error('❌ Error clearing cache:', err.message)
    return false
  }
}

/**
 * Get next refresh time (12 hours from last update)
 */
export async function getNextRefreshTime() {
  try {
    const { data, error } = await supabase
      .from('translated_news')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      const lastUpdate = new Date(data[0].created_at)
      const nextRefresh = new Date(lastUpdate.getTime() + 12 * 60 * 60 * 1000)
      return nextRefresh.toISOString()
    }
  } catch (err) {
    console.error('❌ Error getting next refresh time:', err.message)
  }

  return new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
}

export default {
  getNewsAPIData,
  clearCache,
  getNextRefreshTime,
  cleanupExistingArticles
}
