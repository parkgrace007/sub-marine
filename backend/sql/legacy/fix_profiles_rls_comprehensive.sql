-- ================================================================
-- COMPREHENSIVE FIX: Restore All RLS Policies on Profiles Table
-- ================================================================
--
-- ISSUE: fix_ranking_rls_policy.sql was incomplete
-- - It only created SELECT policy for authenticated users
-- - It deleted UPDATE, INSERT, and Service Role policies
-- - Result: Users couldn't update profiles → app broke when logged in
--
-- SOLUTION: Restore all 5 necessary policies
--
-- Execute in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new
-- ================================================================

-- ================================================================
-- STEP 1: Clean up all existing policies
-- ================================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles for ranking" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users can view profiles for ranking" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;

-- ================================================================
-- STEP 2: Create comprehensive policy set
-- ================================================================

-- Policy 1: SELECT for authenticated users (for ranking leaderboard)
-- Allows logged-in users to view all profiles for ranking
CREATE POLICY "Authenticated users can view profiles for ranking"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 2: SELECT for anonymous users (for public ranking leaderboard)
-- Allows non-logged-in users to view all profiles for ranking
CREATE POLICY "Anonymous users can view profiles for ranking"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'anon');

-- Policy 3: UPDATE for own profile (CRITICAL!)
-- Allows users to update their own profile (trading_balance, nickname, stats, etc.)
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: INSERT for profile creation (for trigger)
-- Allows profile creation when user signs up
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 5: ALL for Service Role (for backend scripts)
-- Allows backend to bypass RLS for admin operations
CREATE POLICY "Service role full access profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- VERIFICATION
-- ================================================================
-- After executing, verify all 5 policies exist:
--
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'profiles'
-- ORDER BY policyname;
--
-- Expected output (5 rows):
-- 1. "Authenticated users can view profiles for ranking" | SELECT | (auth.role() = 'authenticated') | NULL
-- 2. "Anonymous users can view profiles for ranking"     | SELECT | (auth.role() = 'anon')           | NULL
-- 3. "Users can update their own profile"                | UPDATE | (auth.uid() = id)                | (auth.uid() = id)
-- 4. "Users can insert their own profile"                | INSERT | NULL                              | (auth.uid() = id)
-- 5. "Service role full access profiles"                 | ALL    | true                             | true
-- ================================================================

-- ================================================================
-- WHAT THIS FIXES
-- ================================================================
-- ✅ Ranking visible when logged out (anon SELECT policy)
-- ✅ Ranking visible when logged in (authenticated SELECT policy)
-- ✅ Users can update trading_balance (UPDATE policy)
-- ✅ Users can update nickname (UPDATE policy)
-- ✅ Profile created on signup (INSERT policy)
-- ✅ Backend scripts work (Service Role policy)
-- ================================================================
