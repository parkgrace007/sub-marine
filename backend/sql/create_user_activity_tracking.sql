-- =====================================================
-- User Activity Tracking System
-- Created: 2025-11-24
-- Purpose: Track active users and visitor analytics
-- =====================================================

-- =====================================================
-- 1. CREATE USER ACTIVITY LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification (nullable for anonymous users)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,  -- Browser session ID (generated client-side)

  -- User info snapshot (denormalized for performance)
  nickname TEXT,
  is_authenticated BOOLEAN DEFAULT false,

  -- Activity tracking
  current_page TEXT,  -- Current page path (e.g., '/', '/trading', '/admin/dashboard')
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Session metadata
  user_agent TEXT,
  ip_address TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_session_id ON user_activity_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_last_activity ON user_activity_logs(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_is_auth ON user_activity_logs(is_authenticated);

-- Composite index for "active users" query (last 5 minutes)
CREATE INDEX IF NOT EXISTS idx_activity_recent ON user_activity_logs(last_activity_at DESC, is_authenticated);

COMMENT ON TABLE user_activity_logs IS 'Real-time user activity tracking for admin dashboard';
COMMENT ON COLUMN user_activity_logs.session_id IS 'Client-generated UUID for anonymous tracking';
COMMENT ON COLUMN user_activity_logs.last_activity_at IS 'Last heartbeat timestamp (updated every 30s)';

-- =====================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (backend only)
CREATE POLICY "Service role full access"
  ON user_activity_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Users can insert their own activity
CREATE POLICY "Users can insert own activity"
  ON user_activity_logs
  FOR INSERT
  WITH CHECK (
    user_id IS NULL  -- Anonymous users
    OR user_id = auth.uid()  -- Authenticated users only their own
  );

-- Policy: Users can update their own activity
CREATE POLICY "Users can update own activity"
  ON user_activity_logs
  FOR UPDATE
  USING (
    user_id IS NULL  -- Anonymous users (by session_id)
    OR user_id = auth.uid()  -- Authenticated users
  );

-- Policy: Only admins can read all activities
CREATE POLICY "Admins can read all activities"
  ON user_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function: Get active user count (last 5 minutes)
CREATE OR REPLACE FUNCTION get_active_user_count()
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(DISTINCT session_id)
  FROM user_activity_logs
  WHERE last_activity_at > NOW() - INTERVAL '5 minutes';
$$;

COMMENT ON FUNCTION get_active_user_count IS 'Count users active in last 5 minutes';

-- Function: Get active authenticated user count
CREATE OR REPLACE FUNCTION get_active_auth_user_count()
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(DISTINCT user_id)
  FROM user_activity_logs
  WHERE last_activity_at > NOW() - INTERVAL '5 minutes'
  AND is_authenticated = true
  AND user_id IS NOT NULL;
$$;

COMMENT ON FUNCTION get_active_auth_user_count IS 'Count authenticated users active in last 5 minutes';

-- =====================================================
-- 4. AUTO-UPDATE TRIGGER
-- =====================================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_activity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on UPDATE
DROP TRIGGER IF EXISTS trigger_update_activity_timestamp ON user_activity_logs;
CREATE TRIGGER trigger_update_activity_timestamp
  BEFORE UPDATE ON user_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_activity_timestamp();

-- =====================================================
-- 5. CLEANUP OLD ACTIVITY (Optional - run manually or via cron)
-- =====================================================

-- Function: Delete activity logs older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_activity_logs
  WHERE last_activity_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_activity_logs IS 'Delete activity logs older than 7 days (returns deleted count)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

/*
-- Check active users (last 5 minutes)
SELECT
  session_id,
  nickname,
  is_authenticated,
  current_page,
  last_activity_at,
  NOW() - last_activity_at AS idle_duration
FROM user_activity_logs
WHERE last_activity_at > NOW() - INTERVAL '5 minutes'
ORDER BY last_activity_at DESC;

-- Get active user counts
SELECT
  get_active_user_count() AS total_active,
  get_active_auth_user_count() AS authenticated_active;

-- Cleanup old logs
SELECT cleanup_old_activity_logs();
*/
