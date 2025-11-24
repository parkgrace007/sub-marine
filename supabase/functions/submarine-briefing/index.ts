// Submarine Briefing Edge Function
// Generates crypto market briefings every 4 hours using CoinGecko + Claude AI
// Schedule: 0 */4 * * * (every 4 hours)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Types
interface CoinMarket {
  id: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
}

interface GlobalData {
  data: {
    total_market_cap: { usd: number }
    market_cap_percentage: { btc: number }
    market_cap_change_percentage_24h_usd: number
  }
}

interface TrendingCoin {
  item: {
    id: string
    name: string
    symbol: string
    market_cap_rank: number
  }
}

interface MarketData {
  btc: CoinMarket
  eth: CoinMarket
  globalMarketCap: number
  btcDominance: number
  marketCapChange24h: number
  trendingCoins: Array<{ name: string; symbol: string; rank: number }>
}

// Fetch CoinGecko data
async function fetchCoinGeckoData(): Promise<MarketData> {
  const baseUrl = 'https://api.coingecko.com/api/v3'

  // Fetch BTC & ETH market data
  const marketsResponse = await fetch(
    `${baseUrl}/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc&per_page=2&page=1`
  )
  if (!marketsResponse.ok) {
    throw new Error(`CoinGecko markets API error: ${marketsResponse.status}`)
  }
  const markets: CoinMarket[] = await marketsResponse.json()

  const btc = markets.find(coin => coin.id === 'bitcoin')!
  const eth = markets.find(coin => coin.id === 'ethereum')!

  // Fetch global market data
  const globalResponse = await fetch(`${baseUrl}/global`)
  if (!globalResponse.ok) {
    throw new Error(`CoinGecko global API error: ${globalResponse.status}`)
  }
  const globalData: GlobalData = await globalResponse.json()

  // Fetch trending coins
  const trendingResponse = await fetch(`${baseUrl}/search/trending`)
  if (!trendingResponse.ok) {
    throw new Error(`CoinGecko trending API error: ${trendingResponse.status}`)
  }
  const trendingData: { coins: TrendingCoin[] } = await trendingResponse.json()

  return {
    btc,
    eth,
    globalMarketCap: globalData.data.total_market_cap.usd,
    btcDominance: globalData.data.market_cap_percentage.btc,
    marketCapChange24h: globalData.data.market_cap_change_percentage_24h_usd,
    trendingCoins: trendingData.coins.slice(0, 5).map(coin => ({
      name: coin.item.name,
      symbol: coin.item.symbol,
      rank: coin.item.market_cap_rank
    }))
  }
}

// Detect market phase based on data
function detectMarketPhase(data: MarketData): 'risk_on' | 'risk_off' | 'overheating' | 'neutral' {
  const { btc, eth, btcDominance, marketCapChange24h, trendingCoins } = data

  // Count meme coins in trending (simplified detection by common meme coin keywords)
  const memeKeywords = ['pepe', 'doge', 'shib', 'floki', 'bonk', 'wojak', 'meme']
  const memeCount = trendingCoins.filter(coin =>
    memeKeywords.some(keyword =>
      coin.name.toLowerCase().includes(keyword) ||
      coin.symbol.toLowerCase().includes(keyword)
    )
  ).length

  // Logic:
  // 1. Overheating: Meme coins dominate trending (3+ out of 5)
  if (memeCount >= 3) {
    return 'overheating'
  }

  // 2. Risk On: Market cap growing AND BTC dominance declining (altcoin season)
  if (marketCapChange24h > 1 && btc.price_change_percentage_24h < eth.price_change_percentage_24h) {
    return 'risk_on'
  }

  // 3. Risk Off: BTC dominance rising AND alts falling
  if (btc.price_change_percentage_24h > 0 && eth.price_change_percentage_24h < -2) {
    return 'risk_off'
  }

  // 4. Neutral: Default state
  return 'neutral'
}

// Generate briefing using Claude API
async function generateBriefing(data: MarketData, marketPhase: string): Promise<{ title: string; content: string }> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  // Prepare data summary for Claude
  const dataSummary = `
현재 시장 데이터 (UTC ${new Date().toISOString()}):

**비트코인 (BTC)**
- 가격: $${data.btc.current_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
- 24시간 변화: ${data.btc.price_change_percentage_24h.toFixed(2)}%

**이더리움 (ETH)**
- 가격: $${data.eth.current_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
- 24시간 변화: ${data.eth.price_change_percentage_24h.toFixed(2)}%

**글로벌 시장**
- 전체 시가총액: $${(data.globalMarketCap / 1e12).toFixed(2)}T
- BTC 도미넌스: ${data.btcDominance.toFixed(1)}%
- 24시간 시가총액 변화: ${data.marketCapChange24h.toFixed(2)}%

**트렌딩 코인 Top 5**
${data.trendingCoins.map((coin, i) => `${i + 1}. ${coin.name} (${coin.symbol.toUpperCase()})`).join('\n')}

**감지된 시장 단계**: ${marketPhase}
`

  const prompt = `당신은 Submarine AI입니다. 냉소적이고 데이터 중심적인 암호화폐 퀀트 분석가 역할을 수행합니다.

위 데이터를 바탕으로 4시간 시장 브리핑을 작성하세요.

**요구사항**:
1. 감정적 표현 배제, 순수 데이터 기반 분석
2. 시장 단계(market_phase)에 맞는 해석 제공:
   - risk_on: 알트코인 강세, 위험자산 선호
   - risk_off: 비트코인 집중, 안전자산 선호
   - overheating: 밈코인 과열, 투기적 광기
   - neutral: 혼조세, 방향성 불명확
3. 300-500단어 한국어 마크다운
4. 제목은 간결하게 (예: "BTC 도미넌스 상승, 알트코인 약세 지속")
5. 트레이더에게 실용적인 인사이트 제공

형식:
{
  "title": "브리핑 제목",
  "content": "마크다운 본문"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: dataSummary + '\n\n' + prompt
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API error ${response.status}: ${errorText}`)
  }

  const result = await response.json()
  const contentText = result.content[0].text

  // Parse JSON response from Claude
  const jsonMatch = contentText.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse Claude response as JSON')
  }

  const parsed = JSON.parse(jsonMatch[0])
  return {
    title: parsed.title,
    content: parsed.content
  }
}

// Main handler
serve(async (req) => {
  try {
    console.log('🚀 Submarine Briefing started:', new Date().toISOString())

    // Step 1: Fetch CoinGecko data
    console.log('📊 Fetching CoinGecko data...')
    const marketData = await fetchCoinGeckoData()
    console.log('✅ Market data fetched:', {
      btcPrice: marketData.btc.current_price,
      ethPrice: marketData.eth.current_price,
      btcDominance: marketData.btcDominance
    })

    // Step 2: Detect market phase
    const marketPhase = detectMarketPhase(marketData)
    console.log(`🎯 Market phase detected: ${marketPhase}`)

    // Step 3: Generate briefing with Claude
    console.log('🤖 Generating briefing with Claude...')
    const briefing = await generateBriefing(marketData, marketPhase)
    console.log('✅ Briefing generated:', briefing.title)

    // Step 4: Store in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('submarine_briefings')
      .insert([
        {
          title: briefing.title,
          content: briefing.content,
          market_phase: marketPhase
        }
      ])
      .select()

    if (error) {
      throw error
    }

    console.log('✅ Briefing stored in database:', data[0].id)

    return new Response(
      JSON.stringify({
        success: true,
        briefing: data[0],
        marketData: {
          btcPrice: marketData.btc.current_price,
          ethPrice: marketData.eth.current_price,
          btcDominance: marketData.btcDominance,
          marketPhase
        }
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in submarine-briefing:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
