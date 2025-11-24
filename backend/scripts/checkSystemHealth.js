import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSystemHealth() {
  console.log('\n🏥 SUBMARINE SYSTEM HEALTH CHECK\n');
  console.log('=' .repeat(60));

  // 1. Check whale_events table
  console.log('\n📊 WHALE EVENTS CHECK');
  console.log('-'.repeat(60));

  const { data: whales, error: whalesError } = await supabase
    .from('whale_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (whalesError) {
    console.log('❌ Error fetching whales:', whalesError.message);
  } else {
    console.log(`✅ Total records fetched: ${whales.length}`);
    if (whales.length > 0) {
      console.log('\nLast 5 whale events:');
      whales.slice(0, 5).forEach((w, i) => {
        const time = new Date(w.created_at).toLocaleString();
        console.log(`${i+1}. ${w.symbol?.padEnd(6)} | $${(w.amount_usd/1000000).toFixed(2)}M | ${w.flow_type?.padEnd(10)} | ${time}`);
      });

      // Check timeframe distribution
      const timeframes = ['1h', '4h', '8h', '12h', '1d'];
      for (const tf of timeframes) {
        const { count } = await supabase
          .from('whale_events')
          .select('*', { count: 'exact', head: true })
          .eq('timeframe', tf);
        console.log(`   ${tf}: ${count} events`);
      }
    } else {
      console.log('⚠️  No whale events found in database');
    }
  }

  // 2. Check market_sentiment table
  console.log('\n📈 MARKET SENTIMENT CHECK');
  console.log('-'.repeat(60));

  const { data: sentiment, error: sentimentError } = await supabase
    .from('market_sentiment')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (sentimentError) {
    console.log('❌ Error fetching sentiment:', sentimentError.message);
  } else {
    console.log(`✅ Total records fetched: ${sentiment.length}`);
    if (sentiment.length > 0) {
      console.log('\nLast sentiment data by timeframe:');
      const timeframes = ['1h', '4h', '8h', '12h', '1d'];
      for (const tf of timeframes) {
        const record = sentiment.find(s => s.timeframe === tf);
        if (record) {
          const time = new Date(record.created_at).toLocaleString();
          console.log(`${tf.padEnd(4)} | ${record.symbol?.padEnd(6)} | RSI:${record.rsi_average?.toFixed(2).padStart(6)} | Bull:${(record.bull_ratio*100).toFixed(1)}% | ${time}`);
        } else {
          console.log(`${tf.padEnd(4)} | No data`);
        }
      }

      // Check data freshness
      const latest = sentiment[0];
      const age = Date.now() - new Date(latest.created_at).getTime();
      const ageMinutes = Math.floor(age / 60000);
      console.log(`\n📅 Latest data age: ${ageMinutes} minutes ago`);
      if (ageMinutes > 5) {
        console.log('⚠️  Data may be stale (older than 5 minutes)');
      } else {
        console.log('✅ Data is fresh');
      }
    } else {
      console.log('⚠️  No sentiment data found in database');
    }
  }

  // 3. Check alerts table
  console.log('\n🚨 ALERTS CHECK');
  console.log('-'.repeat(60));

  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (alertsError) {
    console.log('❌ Error fetching alerts:', alertsError.message);
  } else {
    console.log(`✅ Total records fetched: ${alerts.length}`);
    if (alerts.length > 0) {
      console.log('\nLast 5 alerts:');
      alerts.slice(0, 5).forEach((a, i) => {
        const time = new Date(a.created_at).toLocaleString();
        const message = a.message?.substring(0, 50) || 'No message';
        console.log(`${i+1}. [${a.tier}] ${a.signal_type} | ${message}... | ${time}`);
      });

      // Check tier distribution
      const tiers = ['S', 'A', 'B', 'C'];
      console.log('\nAlert distribution by tier:');
      for (const tier of tiers) {
        const { count } = await supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('tier', tier);
        console.log(`   ${tier}: ${count} alerts`);
      }
    } else {
      console.log('⚠️  No alerts found in database');
    }
  }

  // 4. Check candle_history table
  console.log('\n📊 CANDLE HISTORY CHECK');
  console.log('-'.repeat(60));

  const { data: candles, error: candlesError } = await supabase
    .from('candle_history')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(5);

  if (candlesError) {
    console.log('❌ Error fetching candles:', candlesError.message);
  } else {
    console.log(`✅ Total records fetched: ${candles.length}`);
    if (candles.length > 0) {
      console.log('\nLast 5 candles:');
      candles.forEach((c, i) => {
        const time = new Date(c.timestamp).toLocaleString();
        console.log(`${i+1}. [${c.timeframe}] ${c.symbol} | Close:$${c.close?.toFixed(2)} | RSI:${c.rsi?.toFixed(2)} | ${time}`);
      });
    } else {
      console.log('⚠️  No candle history found in database');
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Health check complete\n');
}

checkSystemHealth().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
