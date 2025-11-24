-- Create indicator_alerts table for persisting indicator logs
DROP TABLE IF EXISTS indicator_alerts CASCADE;

CREATE TABLE indicator_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeframe TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast querying by timeframe, symbol, and created_at
CREATE INDEX idx_indicator_alerts_timeframe_symbol_created
  ON indicator_alerts(timeframe, symbol, created_at DESC);

-- Index for cleanup operations
CREATE INDEX idx_indicator_alerts_created_at
  ON indicator_alerts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE indicator_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read access
CREATE POLICY "Allow public read access"
  ON indicator_alerts
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policy: Allow service role all operations
CREATE POLICY "Allow service role all operations"
  ON indicator_alerts
  FOR ALL
  TO service_role
  USING (true);

-- Function to automatically cleanup old alerts (keep only 100 most recent per timeframe/symbol)
CREATE OR REPLACE FUNCTION cleanup_old_indicator_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete alerts beyond 100 most recent for this timeframe/symbol combination
  DELETE FROM indicator_alerts
  WHERE id IN (
    SELECT id
    FROM indicator_alerts
    WHERE timeframe = NEW.timeframe AND symbol = NEW.symbol
    ORDER BY created_at DESC
    OFFSET 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run cleanup after each insert
DROP TRIGGER IF EXISTS trigger_cleanup_indicator_alerts ON indicator_alerts;
CREATE TRIGGER trigger_cleanup_indicator_alerts
  AFTER INSERT ON indicator_alerts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_indicator_alerts();
