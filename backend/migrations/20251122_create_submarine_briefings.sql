-- Create submarine_briefings table for storing AI-generated crypto market briefings
-- Generated: 2025-11-22
-- Purpose: Store 4-hour scheduled briefings from submarine-briefing Edge Function

CREATE TABLE IF NOT EXISTS submarine_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  market_phase TEXT NOT NULL CHECK (market_phase IN ('risk_on', 'risk_off', 'overheating', 'neutral')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster querying by creation date
CREATE INDEX idx_submarine_briefings_created_at ON submarine_briefings(created_at DESC);

-- Add Row Level Security (RLS)
ALTER TABLE submarine_briefings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for dashboard display)
CREATE POLICY "Public can view briefings"
  ON submarine_briefings
  FOR SELECT
  USING (true);

-- Only service role can insert (Edge Function will use service role)
CREATE POLICY "Service role can insert briefings"
  ON submarine_briefings
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE submarine_briefings IS 'AI-generated crypto market briefings updated every 4 hours via submarine-briefing Edge Function';
COMMENT ON COLUMN submarine_briefings.market_phase IS 'Detected market phase: risk_on (bullish), risk_off (bearish), overheating (euphoria), neutral';
