import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createAlertTables() {
  console.log('📊 Creating alert system tables...\n');

  // SQL for creating tables
  const sql = `
    -- Enable UUID extension if not already enabled
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Alerts table: stores all generated alerts
    CREATE TABLE IF NOT EXISTS alerts (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      signal_type TEXT NOT NULL,  -- 'S-001', 'S-002', etc.
      tier CHAR(1) NOT NULL,      -- 'S', 'A', 'B', 'C'
      timeframe TEXT,
      symbol TEXT,
      conditions JSONB,            -- Stores detailed signal conditions
      priority INTEGER,
      message TEXT,
      severity TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_tier ON alerts(tier);
    CREATE INDEX IF NOT EXISTS idx_alerts_signal_type ON alerts(signal_type);

    -- Alert history for deduplication
    CREATE TABLE IF NOT EXISTS alert_history (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      signal_hash TEXT UNIQUE NOT NULL,  -- Hash of signal for deduplication
      signal_type TEXT NOT NULL,
      tier CHAR(1) NOT NULL,
      last_triggered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      trigger_count INTEGER DEFAULT 1
    );

    -- Create index for faster deduplication checks
    CREATE INDEX IF NOT EXISTS idx_alert_history_hash ON alert_history(signal_hash);
    CREATE INDEX IF NOT EXISTS idx_alert_history_last_triggered ON alert_history(last_triggered);

    -- Candle history for technical indicators (if not exists)
    CREATE TABLE IF NOT EXISTS candle_history (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      symbol TEXT NOT NULL,
      timeframe TEXT NOT NULL,
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
      open DECIMAL(20, 8),
      high DECIMAL(20, 8),
      low DECIMAL(20, 8),
      close DECIMAL(20, 8),
      volume DECIMAL(20, 8),
      rsi DECIMAL(10, 4),
      macd DECIMAL(20, 8),
      macd_signal DECIMAL(20, 8),
      bb_upper DECIMAL(20, 8),
      bb_middle DECIMAL(20, 8),
      bb_lower DECIMAL(20, 8),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(symbol, timeframe, timestamp)
    );

    -- Create indexes for candle history
    CREATE INDEX IF NOT EXISTS idx_candle_history_symbol ON candle_history(symbol);
    CREATE INDEX IF NOT EXISTS idx_candle_history_timeframe ON candle_history(timeframe);
    CREATE INDEX IF NOT EXISTS idx_candle_history_timestamp ON candle_history(timestamp DESC);

    -- Enable RLS (Row Level Security) for all tables
    ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE candle_history ENABLE ROW LEVEL SECURITY;

    -- Create policies for service role access (allows all operations)
    CREATE POLICY "Service role has full access to alerts" ON alerts
      FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Service role has full access to alert_history" ON alert_history
      FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Service role has full access to candle_history" ON candle_history
      FOR ALL USING (true) WITH CHECK (true);

    -- Create policies for anon role (read-only access)
    CREATE POLICY "Anon users can read alerts" ON alerts
      FOR SELECT USING (true);

    CREATE POLICY "Anon users can read alert_history" ON alert_history
      FOR SELECT USING (true);

    CREATE POLICY "Anon users can read candle_history" ON candle_history
      FOR SELECT USING (true);
  `;

  try {
    // Execute SQL using RPC function (if available)
    // Note: Direct SQL execution via SDK requires a custom RPC function
    // For now, we'll create tables one by one using the SDK

    console.log('⚠️  Direct SQL execution not available via SDK.');
    console.log('📋 Please run the following SQL in Supabase Dashboard SQL Editor:\n');
    console.log('URL: https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new\n');
    console.log('=' .repeat(60));
    console.log(sql);
    console.log('=' .repeat(60));

    // Try to check if tables exist
    const { data: alertCheck, error: alertError } = await supabase
      .from('alerts')
      .select('count')
      .limit(1);

    if (!alertError) {
      console.log('\n✅ Tables already exist!');
      return true;
    }

    console.log('\n❌ Tables do not exist. Please create them using the SQL above.');
    console.log('\n📝 Instructions:');
    console.log('1. Go to: https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new');
    console.log('2. Paste the SQL code above');
    console.log('3. Click "Run" button');
    console.log('4. You should see "Success. No rows returned"');
    console.log('5. Re-run this script to verify tables were created');

    return false;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Run the script
createAlertTables().then((success) => {
  if (success) {
    console.log('\n✅ Alert system tables are ready!');
  } else {
    console.log('\n⚠️  Please create the tables manually in Supabase.');
  }
  process.exit(0);
});