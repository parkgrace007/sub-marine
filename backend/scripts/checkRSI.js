import { supabase } from '../src/utils/supabase.js'

async function checkRSI() {
  console.log('📊 Checking RSI data in database...\n')
  
  const { data, error } = await supabase
    .from('market_sentiment')
    .select('timeframe, rsi_average, rsi_btc, rsi_oversold, rsi_overbought, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log('Latest 5 records:')
  console.table(data)
}

checkRSI()
