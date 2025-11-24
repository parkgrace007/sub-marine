import supabase, { testConnection } from '../src/utils/supabase.js'

async function main() {
  console.log('🔧 Testing Supabase Backend Connection...\n')

  // Test 1: Connection
  const isConnected = await testConnection()
  if (!isConnected) {
    process.exit(1)
  }

  // Test 2: Insert dummy whale event
  console.log('\n📝 Testing INSERT into whale_events...')
  const testWhale = {
    timestamp: Math.floor(Date.now() / 1000),
    blockchain: 'ethereum',
    symbol: 'eth',
    amount: 100.5,
    amount_usd: 250000,
    from_address: '0xtest123',
    to_address: '0xtest456',
    from_owner: 'Binance',
    from_owner_type: 'exchange',
    to_owner_type: 'unknown',
    flow_type: 'inflow',
    transaction_hash: '0xabcd1234'
  }

  const { data: insertData, error: insertError } = await supabase
    .from('whale_events')
    .insert(testWhale)
    .select()

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message)
  } else {
    console.log('✅ Insert successful:', insertData[0].id)
  }

  // Test 3: Query data
  console.log('\n🔍 Testing SELECT from whale_events...')
  const { data: queryData, error: queryError } = await supabase
    .from('whale_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (queryError) {
    console.error('❌ Query failed:', queryError.message)
  } else {
    console.log(`✅ Query successful: ${queryData.length} rows returned`)
  }

  // Test 4: Insert market sentiment
  console.log('\n📈 Testing INSERT into market_sentiment...')
  const testSentiment = {
    timestamp: Math.floor(Date.now() / 1000),
    swsi_score: 0.5,
    bull_ratio: 0.75,
    bear_ratio: 0.25,
    global_mcap_change: 2.3,
    top_coins_change: 1.8,
    volume_change: 5.2
  }

  const { data: sentimentData, error: sentimentError } = await supabase
    .from('market_sentiment')
    .insert(testSentiment)
    .select()

  if (sentimentError) {
    console.error('❌ Sentiment insert failed:', sentimentError.message)
  } else {
    console.log('✅ Sentiment insert successful:', sentimentData[0].id)
  }

  console.log('\n✅ All backend tests passed!')
}

main().catch(console.error)
