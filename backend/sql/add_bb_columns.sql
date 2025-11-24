-- Add price-based Bollinger Bands columns to market_sentiment table
-- These columns were missing, causing BB data from TAAPI.io to be lost

ALTER TABLE market_sentiment
ADD COLUMN IF NOT EXISTS bb_upper NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS bb_middle NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS bb_lower NUMERIC(10, 2);

-- Add comments for documentation
COMMENT ON COLUMN market_sentiment.bb_upper IS 'Price-based Bollinger Band Upper from TAAPI.io (20-period, 2 std dev)';
COMMENT ON COLUMN market_sentiment.bb_middle IS 'Price-based Bollinger Band Middle - 20 period SMA';
COMMENT ON COLUMN market_sentiment.bb_lower IS 'Price-based Bollinger Band Lower from TAAPI.io (20-period, 2 std dev)';

-- Verify columns were added
SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'market_sentiment'
AND column_name IN ('bb_upper', 'bb_middle', 'bb_lower');