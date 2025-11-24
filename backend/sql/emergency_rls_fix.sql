-- ================================================================
-- EMERGENCY RLS FIX: Immediate Database Recovery
-- ================================================================
--
-- PURPOSE: Restore database access for ANON key (frontend)
--
-- PROBLEM: All tables blocked due to missing `TO anon, authenticated`
--
-- SOLUTION: Add explicit role grants to 7 tables
--           (profiles remains public for now - will secure in step 3)
--
-- Execute in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new
-- ================================================================

-- ================================================================
-- TABLE 1: whale_events (고래 거래 데이터)
-- ================================================================
ALTER TABLE public.whale_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to whale_events" ON public.whale_events;
CREATE POLICY "Allow public read access to whale_events"
  ON public.whale_events FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access whale_events" ON public.whale_events;
CREATE POLICY "Service role full access whale_events"
  ON public.whale_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- TABLE 2: indicator_alerts (기술 지표 알림)
-- ================================================================
ALTER TABLE public.indicator_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to indicator_alerts" ON public.indicator_alerts;
CREATE POLICY "Allow public read access to indicator_alerts"
  ON public.indicator_alerts FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access indicator_alerts" ON public.indicator_alerts;
CREATE POLICY "Service role full access indicator_alerts"
  ON public.indicator_alerts FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- TABLE 3: alerts (S/A/B/C 티어 알림)
-- ================================================================
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can read alerts" ON public.alerts;
DROP POLICY IF EXISTS "Allow public read access to alerts" ON public.alerts;
CREATE POLICY "Allow public read access to alerts"
  ON public.alerts FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access alerts" ON public.alerts;
CREATE POLICY "Service role full access alerts"
  ON public.alerts FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- TABLE 4: alert_history (알림 히스토리)
-- ================================================================
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can read alert_history" ON public.alert_history;
DROP POLICY IF EXISTS "Allow public read access to alert_history" ON public.alert_history;
CREATE POLICY "Allow public read access to alert_history"
  ON public.alert_history FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access alert_history" ON public.alert_history;
CREATE POLICY "Service role full access alert_history"
  ON public.alert_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- TABLE 5: market_briefings (AI 시장 브리핑)
-- ================================================================
ALTER TABLE public.market_briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to market_briefings" ON public.market_briefings;
CREATE POLICY "Allow public read access to market_briefings"
  ON public.market_briefings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access market_briefings" ON public.market_briefings;
CREATE POLICY "Service role full access market_briefings"
  ON public.market_briefings FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- TABLE 6: market_sentiment (시장 감정 지표)
-- ================================================================
ALTER TABLE public.market_sentiment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to market_sentiment" ON public.market_sentiment;
CREATE POLICY "Allow public read access to market_sentiment"
  ON public.market_sentiment FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access market_sentiment" ON public.market_sentiment;
CREATE POLICY "Service role full access market_sentiment"
  ON public.market_sentiment FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- TABLE 7: profiles (사용자 프로필 - TEMPORARY PUBLIC)
-- ================================================================
-- ⚠️ WARNING: This is TEMPORARY for ranking functionality
-- Will be secured in Step 3 (secure_profiles_table.sql)
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Temporary: Allow everyone to view all profiles (for ranking)
DROP POLICY IF EXISTS "Temporary public read for rankings" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Temporary public read for rankings"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for trigger)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;
CREATE POLICY "Service role full access profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- TABLE 8: trading_history (거래 히스토리 - 사용자별)
-- ================================================================
ALTER TABLE public.trading_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own trading history
DROP POLICY IF EXISTS "Users can view their own trading history" ON public.trading_history;
CREATE POLICY "Users can view their own trading history"
  ON public.trading_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own trading history
DROP POLICY IF EXISTS "Users can insert their own trading history" ON public.trading_history;
CREATE POLICY "Users can insert their own trading history"
  ON public.trading_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access trading_history" ON public.trading_history;
CREATE POLICY "Service role full access trading_history"
  ON public.trading_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- VERIFICATION QUERY
-- ================================================================
-- After executing, run this to verify all policies:
--
-- SELECT
--   tablename,
--   policyname,
--   roles::text,
--   cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN (
--   'whale_events',
--   'indicator_alerts',
--   'alerts',
--   'alert_history',
--   'market_briefings',
--   'market_sentiment',
--   'profiles',
--   'trading_history'
-- )
-- ORDER BY tablename, policyname;
--
-- Expected: Each table should have policies with {anon,authenticated}
-- ================================================================

-- ================================================================
-- TEST ANON ACCESS
-- ================================================================
-- Test if anon role can now access data:
--
-- SET ROLE anon;
-- SELECT COUNT(*) FROM whale_events;       -- Should return count
-- SELECT COUNT(*) FROM indicator_alerts;
-- SELECT COUNT(*) FROM profiles;           -- Should return count (temporary)
-- RESET ROLE;
-- ================================================================
