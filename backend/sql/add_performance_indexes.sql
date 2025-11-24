-- Performance Indexes for Render Deployment
-- Fixes: "Query timeout after 10 seconds" error in production
-- Run this in Supabase SQL Editor

-- ===== WHALE_EVENTS TABLE =====
-- Problem: Queries on whale_events timeout due to missing indexes
-- Solution: Add composite index on frequently queried columns

-- Index 1: CRITICAL - Composite index for main query pattern
-- Covers: .gte('timestamp', X).gte('amount_usd', Y).in('flow_type', Z).eq('symbol', W)
-- This is the most important index for production performance
CREATE INDEX IF NOT EXISTS idx_whale_events_main_query
ON whale_events (timestamp DESC, amount_usd DESC, flow_type, symbol);

-- Index 2: flow_type for filtering inflow/outflow
-- Speeds up .in('flow_type', ['inflow', 'outflow']) queries
CREATE INDEX IF NOT EXISTS idx_whale_events_flow_type
ON whale_events (flow_type);

-- Index 3: Composite index for time + flow_type (most common query)
-- Covers: .gte('timestamp', X).in('flow_type', ['inflow', 'outflow'])
CREATE INDEX IF NOT EXISTS idx_whale_events_time_flow
ON whale_events (timestamp DESC, flow_type, amount_usd DESC);

-- Index 4: symbol for symbol-specific queries
CREATE INDEX IF NOT EXISTS idx_whale_events_symbol
ON whale_events (symbol);

-- Index 5: amount_usd for whale tier filtering ($10M+)
CREATE INDEX IF NOT EXISTS idx_whale_events_amount
ON whale_events (amount_usd DESC);

-- ===== INDICATOR_ALERTS TABLE =====
-- Index for alert queries filtered by timeframe and symbol

-- Index 1: Composite index for alert queries
CREATE INDEX IF NOT EXISTS idx_indicator_alerts_filter
ON indicator_alerts (timeframe, symbol, created_at DESC);

-- Index 2: created_at for ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_indicator_alerts_created_at
ON indicator_alerts (created_at DESC);

-- ===== MARKET_SENTIMENT TABLE =====
-- Index for sentiment queries

-- Index 1: timestamp for latest sentiment queries
CREATE INDEX IF NOT EXISTS idx_market_sentiment_timestamp
ON market_sentiment (timestamp DESC);

-- Index 2: Composite index for symbol-specific sentiment
CREATE INDEX IF NOT EXISTS idx_market_sentiment_symbol
ON market_sentiment (symbol, timestamp DESC);

-- ===== VERIFY INDEXES =====
-- Check if indexes were created successfully
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('whale_events', 'indicator_alerts', 'market_sentiment')
ORDER BY tablename, indexname;

-- ===== PERFORMANCE TEST =====
-- Run this to verify query performance improvement
EXPLAIN ANALYZE
SELECT *
FROM whale_events
WHERE timestamp >= extract(epoch from now() - interval '8 hours')
AND amount_usd >= 10000000
ORDER BY timestamp DESC
LIMIT 300;
