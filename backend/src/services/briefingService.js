/**
 * 🌐 Market Briefing Service
 *
 * External data sources → Claude AI Analysis → Supabase Storage
 *
 * Data Sources:
 * 1. CoinGecko Markets API - Top 10 cryptocurrencies by market cap (Free, no auth)
 * 2. Alternative.me - Fear & Greed Index
 * 3. Binance API - BTC price & volume
 *
 * AI Analysis: Anthropic Claude Haiku (Professional macro-focused analysis)
 *
 * Schedule: Every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

class BriefingService {
  constructor() {
    // No API keys needed - using free CoinGecko API
  }

  /**
   * 1️⃣ Fetch external market data from 3 free sources
   * - CoinGecko: Top 10 cryptocurrencies by market cap (no auth required) + BTC fallback
   * - Alternative.me: Fear & Greed Index
   * - Binance: BTC price & volume (primary)
   */
  async fetchExternalData() {
    try {
      console.log('📡 [Briefing] Fetching external market data...')

      // A. CoinGecko - Top 10 cryptocurrencies by market cap (Free, no API key)
      // Also used as fallback for BTC data if Binance fails
      let topCoins = []
      let coinGeckoBtc = null // Store BTC data from CoinGecko as fallback
      try {
        const coinsResponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h')
        const coinsData = await coinsResponse.json()

        topCoins = coinsData.slice(0, 10).map(coin => {
          const coinInfo = {
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
            change_24h: coin.price_change_percentage_24h?.toFixed(2) || '0',
            market_cap_rank: coin.market_cap_rank
          }

          // Extract BTC data for fallback
          if (coin.symbol.toLowerCase() === 'btc') {
            coinGeckoBtc = {
              price: coin.current_price,
              change24h: coin.price_change_percentage_24h,
              volume24h: coin.total_volume
            }
          }

          return coinInfo
        })
      } catch (coinsError) {
        console.warn(`⚠️  [Briefing] Failed to fetch top coins: ${coinsError.message}`)
        console.warn(`   Continuing without top coins data...`)
      }

      // B. Fear & Greed Index
      const fngResponse = await fetch('https://api.alternative.me/fng/')
      const fngData = await fngResponse.json()
      const sentiment = fngData.data?.[0] || { value: 'N/A', value_classification: 'Unknown' }

      // C. Binance - BTC 24h stats (Primary source)
      let btcData = { price: 'N/A', change24h: 'N/A', volume24h: 'N/A' }
      let btcSource = 'none'

      try {
        const priceResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT')
        const priceData = await priceResponse.json()

        // Validate response has required fields
        if (priceData && priceData.lastPrice && priceData.priceChangePercent && priceData.volume) {
          const price = parseFloat(priceData.lastPrice)
          const change = parseFloat(priceData.priceChangePercent)
          const volume = parseFloat(priceData.volume)

          // Check for valid numbers
          if (!isNaN(price) && !isNaN(change) && !isNaN(volume)) {
            btcData = {
              price: price.toFixed(0),
              change24h: change.toFixed(2),
              volume24h: (volume * price / 1e9).toFixed(2)
            }
            btcSource = 'binance'
          } else {
            console.warn('⚠️  [Briefing] Binance returned invalid numbers')
          }
        } else {
          console.warn('⚠️  [Briefing] Binance response missing required fields:', priceData)
        }
      } catch (binanceError) {
        console.warn(`⚠️  [Briefing] Failed to fetch Binance data: ${binanceError.message}`)
      }

      // D. Fallback to CoinGecko BTC data if Binance failed
      if (btcData.price === 'N/A' && coinGeckoBtc) {
        console.log('🔄 [Briefing] Using CoinGecko as fallback for BTC data...')

        const price = parseFloat(coinGeckoBtc.price)
        const change = parseFloat(coinGeckoBtc.change24h)
        const volume = parseFloat(coinGeckoBtc.volume24h)

        if (!isNaN(price) && !isNaN(change) && !isNaN(volume)) {
          btcData = {
            price: price.toFixed(0),
            change24h: change.toFixed(2),
            volume24h: (volume / 1e9).toFixed(2) // CoinGecko returns volume in USD, not BTC
          }
          btcSource = 'coingecko'
          console.log('✅ [Briefing] CoinGecko fallback successful')
        }
      }

      // Validate we have at least BTC price before proceeding
      if (btcData.price === 'N/A') {
        throw new Error('Failed to fetch BTC price from both Binance and CoinGecko APIs - cannot generate briefing without price data')
      }

      const marketData = {
        topCoins: topCoins,
        sentiment: {
          value: sentiment.value,
          classification: sentiment.value_classification
        },
        btc: btcData
      }

      console.log('✅ [Briefing] External data fetched successfully')
      console.log(`   BTC: $${marketData.btc.price} (${marketData.btc.change24h}%) [source: ${btcSource}]`)
      console.log(`   Sentiment: ${marketData.sentiment.classification} (${marketData.sentiment.value})`)
      console.log(`   Top coins fetched: ${marketData.topCoins.length}`)

      return marketData
    } catch (error) {
      console.error('❌ [Briefing] Failed to fetch external data:', error.message)
      throw error
    }
  }

  /**
   * 2️⃣ Analyze market data with Claude AI
   */
  async analyzeWithClaude(marketData) {
    try {
      console.log('🤖 [Briefing] Requesting AI analysis from Claude...')

      const userPrompt = `
You are a senior cryptocurrency market analyst at a leading institutional research firm. Provide an in-depth market briefing in Korean that synthesizes technical data with broader market context.

[Market Data - ${new Date().toISOString()}]

1. Bitcoin (BTC):
   - Price: $${marketData.btc.price}
   - 24h Change: ${marketData.btc.change24h}%
   - 24h Volume: $${marketData.btc.volume24h}B

2. Market Sentiment:
   - Fear & Greed Index: ${marketData.sentiment.value}/100 (${marketData.sentiment.classification})

3. Top 10 Cryptocurrencies Performance (24h):
${marketData.topCoins.map((coin, i) => `   ${i + 1}. ${coin.name} (${coin.symbol}): $${coin.price} (${coin.change_24h >= 0 ? '+' : ''}${coin.change_24h}%)`).join('\n')}

---

Analysis Framework:

1. **Market Structure Analysis**:
   - Evaluate BTC dominance and altcoin correlation patterns
   - Identify volume characteristics and liquidity conditions
   - Assess sentiment divergence from price action and its implications

2. **External Factors & Catalysts**:
   - Infer likely macro catalysts based on market behavior (e.g., if fear index is extreme while prices stable → possible rate decision anticipation, regulatory news, or institutional flows)
   - Consider typical market drivers: Fed policy expectations, global risk sentiment, regulatory developments, institutional adoption news
   - Connect price movements to probable external narratives (be specific but acknowledge inference)

3. **Sector Dynamics**:
   - Analyze top 10 coins for sector rotation signals
   - Identify capital concentration patterns (BTC vs ETH vs Layer 1s vs stablecoins)
   - Evaluate strength/weakness of major protocols and what it reveals about investor positioning

4. **Technical & Risk Context**:
   - Reference key support/resistance levels where relevant
   - Assess volatility and risk-reward dynamics
   - Identify potential inflection points

Output Format (Korean):

📉 시장 동향:
(4-5 sentences providing comprehensive market overview)
- Open with BTC price level and 24h movement context
- Discuss volume characteristics and what it signals about market participation
- Analyze sentiment index positioning and any divergence from price action
- Connect market behavior to probable macro catalysts or external factors (e.g., "연준 정책 기대감 변화" or "규제 불확실성" or "기관 자금 유입 신호")
- Conclude with overall market phase assessment

🔥 섹터 분석:
(5-6 sentences analyzing sector dynamics and capital flows)
- Begin with ETH performance relative to BTC and its significance
- Analyze Layer 1 ecosystem (SOL, BNB, ADA, etc.) relative strength
- Discuss stablecoin behavior as risk appetite indicator
- Identify which sectors are attracting capital and why
- Explain sector rotation implications for market cycle position
- Connect patterns to institutional vs retail positioning

🔭 관전 포인트:
(4-5 sentences outlining key monitoring priorities)
- Specify critical price levels for BTC and ETH with reasoning
- Identify key external events or data releases to monitor (even if inferred from current market setup)
- Highlight sentiment extremes or technical setups that could trigger moves
- Provide specific actionable guidance on what signals to track over next 4 hours
- End with balanced risk assessment

Requirements:
- Write 1.5x longer than typical brief (target ~400-450 Korean characters per section)
- Use sophisticated, institutional-grade Korean language
- Naturally incorporate probable external catalysts without stating them as fact (use phrases like "~로 추정됨", "~가능성", "~시사")
- Provide nuanced analysis connecting multiple data points
- Be specific with price levels, percentages, and technical references
- Maintain analytical objectivity while being insightful
- Focus exclusively on top-tier assets (BTC, ETH, major Layer 1s) - completely avoid meme coins
- Output ONLY the Korean briefing sections - no English introductions or headers
`

      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022', // Haiku 3.5 - Most cost-effective model
        max_tokens: 1536, // Increased for longer, more detailed analysis
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      })

      const analysis = message.content[0].text
      console.log('✅ [Briefing] AI analysis completed')
      console.log(`   Tokens used: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output`)

      return analysis
    } catch (error) {
      console.error('❌ [Briefing] Claude API error:', error.message)
      throw error
    }
  }

  /**
   * 3️⃣ Save briefing to Supabase
   */
  async saveBriefing(analysis, marketData) {
    try {
      const { data, error } = await supabase
        .from('market_briefings')
        .insert({
          content: analysis,
          metadata: {
            btc_price: marketData.btc.price,
            price_change_24h: marketData.btc.change24h,
            btc_volume_24h: marketData.btc.volume24h,
            sentiment_score: marketData.sentiment.value,
            sentiment_label: marketData.sentiment.classification,
            top_coins_count: marketData.topCoins.length,
            top_coins: marketData.topCoins
          },
          created_at: new Date().toISOString()
        })
        .select()

      if (error) throw error

      console.log('✅ [Briefing] Saved to database')
      return data[0]
    } catch (error) {
      console.error('❌ [Briefing] Failed to save:', error.message)
      throw error
    }
  }

  /**
   * 🚀 Main execution flow
   */
  async generateBriefing() {
    console.log('\n🌊 [Submarine Market Briefing] Starting...')
    console.log(`   Time: ${new Date().toLocaleString('ko-KR')}`)

    try {
      // Step 1: Fetch external data
      const marketData = await this.fetchExternalData()

      // Step 2: Analyze with AI
      const analysis = await this.analyzeWithClaude(marketData)

      // Step 3: Save to DB
      const savedBriefing = await this.saveBriefing(analysis, marketData)

      console.log('✅ [Submarine Market Briefing] Completed successfully\n')
      console.log('📄 Preview:')
      console.log(analysis)
      console.log('')

      return savedBriefing
    } catch (error) {
      console.error('❌ [Submarine Market Briefing] Failed:', error.message)
      throw error
    }
  }
}

export default new BriefingService()
