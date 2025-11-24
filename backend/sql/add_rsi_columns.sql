-- =====================================================
-- RSI Integration: Add RSI columns to market_sentiment
-- =====================================================
-- This migration adds RSI (Relative Strength Index) data
-- to the existing market_sentiment table.
--
-- RSI Data (fetched every 5 minutes from TAAPI.io):
-- - rsi_average: Average RSI across 5 coins (BTC, ETH, BNB, SOL, XRP)
-- - rsi_btc: BTC-specific RSI value
-- - rsi_oversold: Boolean flag for oversold condition (RSI < 30)
-- - rsi_overbought: Boolean flag for overbought condition (RSI > 70)
-- =====================================================

-- Add RSI columns to market_sentiment table
ALTER TABLE market_sentiment
ADD COLUMN IF NOT EXISTS rsi_average NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS rsi_btc NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS rsi_oversold BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rsi_overbought BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN market_sentiment.rsi_average IS 'Average RSI across 5 coins (BTC, ETH, BNB, SOL, XRP). Range: 0-100. Updated every 5 minutes.';
COMMENT ON COLUMN market_sentiment.rsi_btc IS 'Bitcoin-specific RSI value. Range: 0-100. Updated every 5 minutes.';
COMMENT ON COLUMN market_sentiment.rsi_oversold IS 'Oversold indicator: TRUE when rsi_average < 30';
COMMENT ON COLUMN market_sentiment.rsi_overbought IS 'Overbought indicator: TRUE when rsi_average > 70';

-- Create composite index for efficient RSI queries
-- This index supports queries filtering by timeframe and RSI values
CREATE INDEX IF NOT EXISTS idx_market_sentiment_rsi
ON market_sentiment(timeframe, rsi_average, created_at DESC);

-- Create index for overbought/oversold filtering
CREATE INDEX IF NOT EXISTS idx_market_sentiment_rsi_signals
ON market_sentiment(timeframe, rsi_oversold, rsi_overbought, created_at DESC);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'market_sentiment'
AND column_name LIKE 'rsi%'
ORDER BY ordinal_position;
