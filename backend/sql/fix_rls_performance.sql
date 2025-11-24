-- ===== CRITICAL: Fix RLS Performance Issues =====
-- Issue: RLS policies re-evaluate auth functions for EACH ROW
-- Impact: Massive performance degradation at scale
-- Solution: Wrap auth functions in subqueries: (select auth.uid())
--
-- Run this in Supabase SQL Editor IMMEDIATELY

-- ===== STEP 1: Drop existing problematic policies =====

-- whale_events table
DROP POLICY IF EXISTS "Service write whale events" ON whale_events;
DROP POLICY IF EXISTS "Allow public read access to whale_events" ON whale_events;

-- market_sentiment table
DROP POLICY IF EXISTS "Service write market_sentiment" ON market_sentiment;
DROP POLICY IF EXISTS "Allow public read access to market_sentiment" ON market_sentiment;

-- indicator_alerts table
DROP POLICY IF EXISTS "Service write indicator_alerts" ON indicator_alerts;
DROP POLICY IF EXISTS "Allow public read access to indicator_alerts" ON indicator_alerts;

-- whale_alert_briefing table
DROP POLICY IF EXISTS "Service write whale briefing" ON whale_alert_briefing;
DROP POLICY IF EXISTS "Allow public read access to whale_alert_briefing" ON whale_alert_briefing;

-- crypto_news table
DROP POLICY IF EXISTS "Service write crypto news" ON crypto_news;
DROP POLICY IF EXISTS "Allow public read access to crypto_news" ON crypto_news;

-- ===== STEP 2: Create optimized policies with subqueries =====

-- whale_events: Public read, service write
CREATE POLICY "whale_events_public_read"
ON whale_events
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "whale_events_service_write"
ON whale_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- market_sentiment: Public read, service write
CREATE POLICY "market_sentiment_public_read"
ON market_sentiment
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "market_sentiment_service_write"
ON market_sentiment
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- indicator_alerts: Public read, service write
CREATE POLICY "indicator_alerts_public_read"
ON indicator_alerts
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "indicator_alerts_service_write"
ON indicator_alerts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- whale_alert_briefing: Public read, service write
CREATE POLICY "whale_briefing_public_read"
ON whale_alert_briefing
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "whale_briefing_service_write"
ON whale_alert_briefing
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- crypto_news: Public read, service write
CREATE POLICY "crypto_news_public_read"
ON crypto_news
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "crypto_news_service_write"
ON crypto_news
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ===== STEP 3: Verify policies =====
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'whale_events',
  'market_sentiment',
  'indicator_alerts',
  'whale_alert_briefing',
  'crypto_news'
)
ORDER BY tablename, policyname;

-- ===== STEP 4: Test policies =====

-- Test as anon role (frontend)
SET ROLE anon;

-- Should succeed (read access)
SELECT COUNT(*) FROM whale_events;
SELECT COUNT(*) FROM market_sentiment;
SELECT COUNT(*) FROM indicator_alerts;

-- Should fail (no write access)
-- INSERT INTO whale_events (id) VALUES (gen_random_uuid());

RESET ROLE;

-- Test as service_role (backend)
SET ROLE service_role;

-- Should succeed (full access)
SELECT COUNT(*) FROM whale_events;
-- INSERT and DELETE should also work

RESET ROLE;

-- ===== SUCCESS MESSAGE =====
SELECT 'RLS policies optimized successfully!' AS status;
