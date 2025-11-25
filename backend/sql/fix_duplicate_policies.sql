-- ============================================================
-- FIX DUPLICATE RLS POLICIES & INDEXES
--
-- Problem: 27 performance issues caused by duplicate policies
-- - whale_events: 4 duplicate policies (causing 30s timeout!)
-- - market_sentiment: 3 duplicate policies
-- - profiles: 3 duplicate policies
-- - And 5 duplicate indexes
--
-- Solution: Remove duplicates, keep 2 policies per table
-- - 1 for public read (anon, authenticated)
-- - 1 for service write (service_role)
--
-- Date: 2025-11-25
-- ============================================================

-- ===== STEP 1: WHALE_EVENTS (CRITICAL - 4 duplicates!) =====
DROP POLICY IF EXISTS "Anyone can read whale events" ON whale_events;
DROP POLICY IF EXISTS "Enable read access for all users" ON whale_events;
DROP POLICY IF EXISTS "Service role full access whale_events" ON whale_events;
DROP POLICY IF EXISTS "whale_events_read" ON whale_events;

CREATE POLICY "whale_events_public_read"
ON whale_events FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "whale_events_service_write"
ON whale_events FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ===== STEP 2: MARKET_SENTIMENT (3 duplicates) =====
DROP POLICY IF EXISTS "Public read market_sentiment" ON market_sentiment;
DROP POLICY IF EXISTS "Service role full access market_sentiment" ON market_sentiment;
DROP POLICY IF EXISTS "market_sentiment_read" ON market_sentiment;

CREATE POLICY "market_sentiment_public_read"
ON market_sentiment FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "market_sentiment_service_write"
ON market_sentiment FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ===== STEP 3: PROFILES (3 duplicates) =====
DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;
DROP POLICY IF EXISTS "Temporary public read for rankings" ON profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON profiles;

CREATE POLICY "profiles_public_read"
ON profiles FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "profiles_user_write"
ON profiles FOR ALL TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_service_write"
ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ===== STEP 4: SUBMARINE_BRIEFINGS (2 duplicates) =====
DROP POLICY IF EXISTS "Public can view briefings" ON submarine_briefings;
DROP POLICY IF EXISTS "submarine_briefings_read" ON submarine_briefings;

CREATE POLICY "submarine_briefings_public_read"
ON submarine_briefings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "submarine_briefings_service_write"
ON submarine_briefings FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ===== STEP 5: TRADING_HISTORY (2 duplicates) =====
DROP POLICY IF EXISTS "Service role full access trading_history" ON trading_history;
DROP POLICY IF EXISTS "trading_history_user_insert" ON trading_history;
DROP POLICY IF EXISTS "trading_history_user_read" ON trading_history;

CREATE POLICY "trading_history_user_access"
ON trading_history FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trading_history_service_write"
ON trading_history FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ===== STEP 6: USER_RANKINGS (2 duplicates) =====
DROP POLICY IF EXISTS "Anyone can view rankings" ON user_rankings;
DROP POLICY IF EXISTS "Service role full access user_rankings" ON user_rankings;

CREATE POLICY "user_rankings_public_read"
ON user_rankings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "user_rankings_service_write"
ON user_rankings FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ===== STEP 7: X_INFLUENCER_POSTS (2 duplicates) =====
DROP POLICY IF EXISTS "Anon can read x_posts" ON x_influencer_posts;
DROP POLICY IF EXISTS "Service role full access x_posts" ON x_influencer_posts;

CREATE POLICY "x_posts_public_read"
ON x_influencer_posts FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "x_posts_service_write"
ON x_influencer_posts FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ===== STEP 8: DELETE DUPLICATE INDEXES (5 pairs) =====
DROP INDEX IF EXISTS idx_whale_flow_type;
DROP INDEX IF EXISTS idx_whale_symbol;
DROP INDEX IF EXISTS idx_indicator_alerts_timeframe_symbol_created;
DROP INDEX IF EXISTS idx_sentiment_timestamp;
DROP INDEX IF EXISTS idx_translated_news_url;


-- ===== STEP 9: VERIFICATION =====
-- Check policy count per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- whale_events should have exactly 2 policies
SELECT policyname FROM pg_policies
WHERE tablename = 'whale_events';

-- Success message
SELECT 'SUCCESS: Duplicate policies and indexes removed!' AS status;
