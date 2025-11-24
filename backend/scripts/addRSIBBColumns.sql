-- Add RSI-based Bollinger Bands columns to market_sentiment table
-- These columns store BB calculated from RSI(14) values, not price

ALTER TABLE market_sentiment
ADD COLUMN IF NOT EXISTS rsi_sma NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS rsi_bb_upper NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS rsi_bb_middle NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS rsi_bb_lower NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS rsi_bb_stddev NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS rsi_bb_insufficient_data BOOLEAN DEFAULT FALSE;

-- Add comments for clarity
COMMENT ON COLUMN market_sentiment.rsi_sma IS 'RSI(14) 20-period Simple Moving Average';
COMMENT ON COLUMN market_sentiment.rsi_bb_upper IS 'RSI-based Bollinger Band Upper (RSI_SMA + 2*StdDev)';
COMMENT ON COLUMN market_sentiment.rsi_bb_middle IS 'RSI-based Bollinger Band Middle (same as RSI_SMA)';
COMMENT ON COLUMN market_sentiment.rsi_bb_lower IS 'RSI-based Bollinger Band Lower (RSI_SMA - 2*StdDev)';
COMMENT ON COLUMN market_sentiment.rsi_bb_stddev IS 'Standard Deviation of RSI(14) over 20 periods';
COMMENT ON COLUMN market_sentiment.rsi_bb_insufficient_data IS 'True if less than 20 data points available for calculation';
