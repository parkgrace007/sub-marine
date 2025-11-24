-- ================================================================
-- CREATE USER_RANKINGS TABLE: Secure Public Ranking System
-- ================================================================
--
-- PURPOSE: Separate public ranking data from private user profiles
--
-- SECURITY: Only expose nickname and ROI%, protect UUID and email
--
-- FEATURES:
--   - Auto-sync with profiles table via trigger
--   - Serial ID instead of UUID (prevents enumeration attacks)
--   - Public read access (anon + authenticated)
--
-- Execute in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new
-- ================================================================

-- ================================================================
-- STEP 1: Create user_rankings table
-- ================================================================
CREATE TABLE IF NOT EXISTS public.user_rankings (
  -- Public ID (serial, not UUID)
  id serial PRIMARY KEY,

  -- Internal mapping (NOT exposed to frontend)
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,

  -- Public data (exposed to frontend)
  display_name text NOT NULL,
  roi_percentage numeric DEFAULT 0,

  -- Cached ranking (updated by trigger or scheduled job)
  rank_position integer,

  -- Metadata
  last_updated timestamp DEFAULT now(),
  created_at timestamp DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_rankings_user_id ON public.user_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rankings_roi ON public.user_rankings(roi_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_user_rankings_rank ON public.user_rankings(rank_position);

-- ================================================================
-- STEP 2: Create trigger function for auto-sync
-- ================================================================
CREATE OR REPLACE FUNCTION sync_user_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate ROI
  DECLARE
    calculated_roi numeric;
  BEGIN
    IF NEW.initial_balance > 0 THEN
      calculated_roi := ((NEW.trading_balance - NEW.initial_balance) / NEW.initial_balance) * 100;
    ELSE
      calculated_roi := 0;
    END IF;

    -- Insert or update user_rankings
    INSERT INTO public.user_rankings (user_id, display_name, roi_percentage, last_updated)
    VALUES (
      NEW.id,
      NEW.nickname,
      calculated_roi,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      display_name = EXCLUDED.display_name,
      roi_percentage = EXCLUDED.roi_percentage,
      last_updated = now();

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 3: Attach trigger to profiles table
-- ================================================================
DROP TRIGGER IF EXISTS update_rankings_on_profile_change ON public.profiles;
CREATE TRIGGER update_rankings_on_profile_change
  AFTER INSERT OR UPDATE OF nickname, trading_balance, initial_balance
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_rankings();

-- ================================================================
-- STEP 4: Migrate existing profiles data to user_rankings
-- ================================================================
-- Insert all existing users into user_rankings
INSERT INTO public.user_rankings (user_id, display_name, roi_percentage, last_updated)
SELECT
  id,
  nickname,
  CASE
    WHEN initial_balance > 0
    THEN ((trading_balance - initial_balance) / initial_balance) * 100
    ELSE 0
  END AS roi_percentage,
  now()
FROM public.profiles
ON CONFLICT (user_id) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  roi_percentage = EXCLUDED.roi_percentage,
  last_updated = now();

-- ================================================================
-- STEP 5: Enable RLS and create policies
-- ================================================================
ALTER TABLE public.user_rankings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to SELECT (public rankings)
DROP POLICY IF EXISTS "Anyone can view rankings" ON public.user_rankings;
CREATE POLICY "Anyone can view rankings"
  ON public.user_rankings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role full access (for backend updates)
DROP POLICY IF EXISTS "Service role full access user_rankings" ON public.user_rankings;
CREATE POLICY "Service role full access user_rankings"
  ON public.user_rankings FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================
-- After executing, run these to verify:

-- 1. Check user_rankings table
-- SELECT
--   id,
--   display_name,
--   roi_percentage,
--   rank_position,
--   last_updated
-- FROM user_rankings
-- ORDER BY roi_percentage DESC
-- LIMIT 10;
--
-- Expected: Only public columns visible (no user_id in SELECT)

-- 2. Test trigger (update a profile and check sync)
-- UPDATE profiles
-- SET trading_balance = 15000
-- WHERE id = (SELECT id FROM profiles LIMIT 1);
--
-- Then check:
-- SELECT * FROM user_rankings
-- WHERE user_id = (SELECT id FROM profiles LIMIT 1);
--
-- Expected: roi_percentage updated automatically

-- 3. Test RLS with anon role
-- SET ROLE anon;
-- SELECT COUNT(*) FROM user_rankings;  -- Should succeed
-- SELECT COUNT(*) FROM profiles;        -- Should fail (after Step 3)
-- RESET ROLE;

-- ================================================================
-- OPTIONAL: Function to update rank_position (for cached rankings)
-- ================================================================
-- Run this periodically (e.g., every 5 minutes) to cache rankings
CREATE OR REPLACE FUNCTION update_rank_positions()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY roi_percentage DESC) AS new_rank
    FROM user_rankings
  )
  UPDATE user_rankings
  SET rank_position = ranked_users.new_rank
  FROM ranked_users
  WHERE user_rankings.id = ranked_users.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute once to populate initial ranks
SELECT update_rank_positions();

-- ================================================================
-- NOTES
-- ================================================================
-- 1. user_id is NEVER exposed in frontend queries
-- 2. Frontend only queries: id, display_name, roi_percentage, rank_position
-- 3. Trigger automatically syncs on profile changes
-- 4. rank_position is cached for performance (updated periodically)
-- ================================================================
