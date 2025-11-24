-- =====================================================
-- MACD Integration: Add MACD columns to market_sentiment
-- =====================================================
-- This migration adds MACD (Moving Average Convergence Divergence) data
-- to the existing market_sentiment table.
--
-- MACD Data (fetched every 5 minutes from TAAPI.io):
-- - macd_line: MACD Line (12 EMA - 26 EMA)
-- - macd_signal: Signal Line (9 EMA of MACD Line)
-- - macd_histogram: Histogram (MACD Line - Signal Line)
-- - macd_cross: Cross pattern ('golden', 'death', or NULL)
-- - macd_divergence: Divergence pattern ('bullish', 'bearish', or NULL) [optional]
-- =====================================================

-- Add MACD columns to market_sentiment table
ALTER TABLE market_sentiment
ADD COLUMN IF NOT EXISTS macd_line NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS macd_signal NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS macd_histogram NUMERIC(10,6),
ADD COLUMN IF NOT EXISTS macd_cross TEXT CHECK (macd_cross IN ('golden', 'death')),
ADD COLUMN IF NOT EXISTS macd_divergence TEXT CHECK (macd_divergence IN ('bullish', 'bearish'));

-- Add comments for documentation
COMMENT ON COLUMN market_sentiment.macd_line IS 'MACD Line (12 EMA - 26 EMA). Updated every 5 minutes.';
COMMENT ON COLUMN market_sentiment.macd_signal IS 'Signal Line (9 EMA of MACD Line). Updated every 5 minutes.';
COMMENT ON COLUMN market_sentiment.macd_histogram IS 'Histogram (MACD Line - Signal Line). Positive = bullish, Negative = bearish.';
COMMENT ON COLUMN market_sentiment.macd_cross IS 'Cross pattern: "golden" (MACD crosses above Signal), "death" (MACD crosses below Signal)';
COMMENT ON COLUMN market_sentiment.macd_divergence IS 'Divergence pattern: "bullish" (price down + MACD up), "bearish" (price up + MACD down)';

-- Create composite index for efficient MACD queries
-- This index supports queries filtering by timeframe and MACD cross patterns
CREATE INDEX IF NOT EXISTS idx_market_sentiment_macd
ON market_sentiment(timeframe, macd_cross, created_at DESC);

-- Create index for histogram filtering (bullish vs bearish)
CREATE INDEX IF NOT EXISTS idx_market_sentiment_macd_histogram
ON market_sentiment(timeframe, macd_histogram, created_at DESC)
WHERE macd_histogram IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'market_sentiment'
AND column_name LIKE 'macd%'
ORDER BY ordinal_position;
