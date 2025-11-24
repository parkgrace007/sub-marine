-- ================================================================
-- SECURE PROFILES TABLE: Lock Down Private User Data
-- ================================================================
--
-- PURPOSE: Restrict profiles table to owner-only access
--
-- SECURITY:
--   - Remove public read access (was temporary for rankings)
--   - Only owner can view/update their own profile
--   - Service role retains full access (for triggers)
--
-- PREREQUISITE: user_rankings table must exist and be populated
--   (created in create_user_rankings.sql - Step 2)
--
-- Execute in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new
-- ================================================================

-- ================================================================
-- STEP 1: Remove all existing policies
-- ================================================================
DROP POLICY IF EXISTS "Temporary public read for rankings" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles for ranking" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users can view profiles for ranking" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;

-- ================================================================
-- STEP 2: Create restrictive policies (owner-only)
-- ================================================================

-- Policy 1: SELECT - Users can only view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: UPDATE - Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: INSERT - Users can insert their own profile (for trigger)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 4: Service role full access (for backend operations)
CREATE POLICY "Service role full access profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================
-- After executing, run these to verify security:

-- 1. Test anon role (should FAIL)
-- SET ROLE anon;
-- SELECT * FROM profiles LIMIT 1;
-- -- Expected: permission denied error
-- RESET ROLE;

-- 2. Test authenticated role (should see only OWN profile)
-- -- This requires running in a browser console with actual user session
-- -- Example Supabase client query:
-- const { data, error } = await supabase
--   .from('profiles')
--   .select('*');
-- -- Expected: Returns only the current user's profile

-- 3. Verify user_rankings still accessible
-- SET ROLE anon;
-- SELECT COUNT(*) FROM user_rankings;
-- -- Expected: Returns count (public access confirmed)
-- RESET ROLE;

-- 4. Check all policies
-- SELECT
--   tablename,
--   policyname,
--   roles::text,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename = 'profiles'
-- ORDER BY policyname;
--
-- Expected policies:
--   1. "Users can view their own profile" - SELECT - {authenticated}
--   2. "Users can update their own profile" - UPDATE - {authenticated}
--   3. "Users can insert their own profile" - INSERT - {authenticated}
--   4. "Service role full access profiles" - ALL - {(no roles)}

-- ================================================================
-- SECURITY CHECKLIST
-- ================================================================
-- After executing this script, verify:
--
-- [ ] anon role CANNOT access profiles
-- [ ] authenticated users can ONLY see their own profile
-- [ ] user_rankings is still publicly accessible
-- [ ] Ranking page still works (using user_rankings)
-- [ ] Profile updates still trigger user_rankings sync
-- [ ] Trading game balance updates still work
--
-- ================================================================
-- ROLLBACK (if needed)
-- ================================================================
-- If you need to rollback to public access (NOT recommended):
--
-- DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
-- CREATE POLICY "Temporary public read for rankings"
--   ON public.profiles FOR SELECT
--   TO anon, authenticated
--   USING (true);
--
-- (But this defeats the purpose of the secure ranking system!)
-- ================================================================
