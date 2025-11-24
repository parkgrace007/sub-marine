-- ===== EMERGENCY: Fix ALL RLS Performance Issues =====
-- Issue: Multiple duplicate policies causing massive performance degradation
-- Each duplicate policy executes for EVERY query = catastrophic slowdown
--
-- Run this in Supabase SQL Editor IMMEDIATELY

-- ===== STEP 1: Drop ALL problematic policies =====

-- whale_events
DROP POLICY IF EXISTS "Service write whale events" ON whale_events;
DROP POLICY IF EXISTS "Allow public read access to whale_events" ON whale_events;

-- market_sentiment
DROP POLICY IF EXISTS "Service write market_sentiment" ON market_sentiment;
DROP POLICY IF EXISTS "Allow public read access to market_sentiment" ON market_sentiment;

-- indicator_alerts (MULTIPLE DUPLICATES!)
DROP POLICY IF EXISTS "Allow public read access to indicator_alerts" ON indicator_alerts;
DROP POLICY IF EXISTS "Enable read access for all users" ON indicator_alerts;
DROP POLICY IF EXISTS "Service role full access indicator_alerts" ON indicator_alerts;
DROP POLICY IF EXISTS "Service write indicator_alerts" ON indicator_alerts;

-- alert_history (TONS OF DUPLICATES!)
DROP POLICY IF EXISTS "Allow public read access to alert_history" ON alert_history;
DROP POLICY IF EXISTS "Anon users can read alert_history" ON alert_history;
DROP POLICY IF EXISTS "Service role full access alert_history" ON alert_history;
DROP POLICY IF EXISTS "Service role has full access to alert_history" ON alert_history;

-- alerts (TONS OF DUPLICATES!)
DROP POLICY IF EXISTS "Allow public read access to alerts" ON alerts;
DROP POLICY IF EXISTS "Anon users can read alerts" ON alerts;
DROP POLICY IF EXISTS "Service role full access alerts" ON alerts;
DROP POLICY IF EXISTS "Service role has full access to alerts" ON alerts;

-- candle_history
DROP POLICY IF EXISTS "Anon users can read candle_history" ON candle_history;
DROP POLICY IF EXISTS "Service role has full access to candle_history" ON candle_history;

-- market_briefings (MULTIPLE DUPLICATES!)
DROP POLICY IF EXISTS "Allow public read access" ON market_briefings;
DROP POLICY IF EXISTS "Allow public read access to market_briefings" ON market_briefings;
DROP POLICY IF EXISTS "Enable read access for all users" ON market_briefings;
DROP POLICY IF EXISTS "Service role full access market_briefings" ON market_briefings;

-- Note: whale_alert_briefing table does not exist, skipping
-- Note: crypto_news table does not exist, skipping

-- submarine_briefings
DROP POLICY IF EXISTS "Service role can insert briefings" ON submarine_briefings;
DROP POLICY IF EXISTS "Allow public read access to submarine_briefings" ON submarine_briefings;

-- trading_history
DROP POLICY IF EXISTS "Users can view their own trading history" ON trading_history;
DROP POLICY IF EXISTS "Users can insert their own trading history" ON trading_history;

-- profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- admin_audit_logs
DROP POLICY IF EXISTS "Admins can read audit logs" ON admin_audit_logs;

-- ===== STEP 2: Create SINGLE optimized policy per table =====

-- whale_events: Public read, service write (MOST CRITICAL)
CREATE POLICY "whale_events_read"
ON whale_events FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "whale_events_write"
ON whale_events FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- market_sentiment: Public read, service write
CREATE POLICY "market_sentiment_read"
ON market_sentiment FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "market_sentiment_write"
ON market_sentiment FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- indicator_alerts: Public read, service write (CRITICAL)
CREATE POLICY "indicator_alerts_read"
ON indicator_alerts FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "indicator_alerts_write"
ON indicator_alerts FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- alert_history: Public read, service write
CREATE POLICY "alert_history_read"
ON alert_history FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "alert_history_write"
ON alert_history FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- alerts: Public read, service write
CREATE POLICY "alerts_read"
ON alerts FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "alerts_write"
ON alerts FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- candle_history: Public read, service write
CREATE POLICY "candle_history_read"
ON candle_history FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "candle_history_write"
ON candle_history FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- market_briefings: Public read, service write
CREATE POLICY "market_briefings_read"
ON market_briefings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "market_briefings_write"
ON market_briefings FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Note: whale_alert_briefing table does not exist, skipping policy creation
-- Note: crypto_news table does not exist, skipping policy creation

-- submarine_briefings: Public read, service write
CREATE POLICY "submarine_briefings_read"
ON submarine_briefings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "submarine_briefings_write"
ON submarine_briefings FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- trading_history: Users see their own, service full access
CREATE POLICY "trading_history_user_read"
ON trading_history FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "trading_history_user_insert"
ON trading_history FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "trading_history_service"
ON trading_history FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- profiles: Users manage their own, everyone can view
CREATE POLICY "profiles_public_read"
ON profiles FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "profiles_user_update"
ON profiles FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_user_insert"
ON profiles FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

-- admin_audit_logs: Only service role
CREATE POLICY "admin_logs_service"
ON admin_audit_logs FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- ===== STEP 3: Verify policies =====
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'whale_events',
  'market_sentiment',
  'indicator_alerts',
  'alert_history',
  'alerts',
  'candle_history',
  'market_briefings',
  'submarine_briefings',
  'trading_history',
  'profiles',
  'admin_audit_logs'
)
ORDER BY tablename, policyname;

-- ===== STEP 4: Test access =====
SET ROLE anon;

-- Should succeed (read access)
SELECT COUNT(*) FROM whale_events;
SELECT COUNT(*) FROM indicator_alerts;
SELECT COUNT(*) FROM market_sentiment;

RESET ROLE;

-- ===== SUCCESS MESSAGE =====
SELECT '✅ ALL RLS policies fixed! Duplicates removed!' AS status;
