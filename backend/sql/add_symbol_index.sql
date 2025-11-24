-- Add index for symbol-based queries on market_sentiment table
-- This optimizes queries that filter by symbol and timeframe
-- Usage: Run this in Supabase SQL Editor

-- Create composite index for (symbol, timeframe, created_at DESC)
-- This speeds up queries like:
-- - SELECT * FROM market_sentiment WHERE symbol = 'TOTAL' AND timeframe = '1h' ORDER BY created_at DESC
-- - SELECT * FROM market_sentiment WHERE symbol = 'BTC' AND timeframe = '4h' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_market_sentiment_symbol_timeframe_created
ON market_sentiment(symbol, timeframe, created_at DESC);

-- Verify index was created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'market_sentiment'
AND indexname = 'idx_market_sentiment_symbol_timeframe_created';
