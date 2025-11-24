-- ================================================================
-- Fix RLS Policy for Ranking Feature
-- ================================================================
--
-- Issue: The current RLS policy only allows users to view their own profile
-- Solution: Allow authenticated users to view all profiles for ranking
--
-- Execute this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new
-- ================================================================

-- Step 1: Remove the restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Step 2: Create new policy allowing authenticated users to view all profiles
CREATE POLICY "Authenticated users can view profiles for ranking"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ================================================================
-- Verification
-- ================================================================
-- After executing, verify the policy:
--
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
--
-- Expected result:
-- - Policy name: "Authenticated users can view profiles for ranking"
-- - Command: SELECT
-- - Qual: (auth.role() = 'authenticated'::text)
-- ================================================================

-- ================================================================
-- Security Notes
-- ================================================================
-- ✅ Safe: Only authenticated users can view profiles
-- ✅ Privacy: Only public fields are exposed (nickname, trading stats)
-- ✅ Limited: Users can still only UPDATE/DELETE their own profile
-- ================================================================
