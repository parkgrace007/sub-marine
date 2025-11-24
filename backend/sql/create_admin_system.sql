-- =====================================================
-- SubMarine Admin System Database Schema
-- Created: 2025-11-23
-- Purpose: Admin role management + Audit logging
-- =====================================================

-- =====================================================
-- 1. ADD ROLE COLUMN TO PROFILES TABLE
-- =====================================================

-- Add role column (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add comment
COMMENT ON COLUMN profiles.role IS 'User role: user, moderator, admin, super_admin';

-- =====================================================
-- 2. CREATE ADMIN AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email TEXT,  -- Denormalized for faster queries

  -- What action was performed
  action TEXT NOT NULL,  -- e.g., 'USER_BAN', 'ROLE_CHANGE', 'WHALE_RECONNECT'
  resource_type TEXT,    -- e.g., 'user', 'service', 'data'
  resource_id TEXT,      -- ID of affected resource

  -- Details and context
  details JSONB,         -- Flexible field for action-specific data
  ip_address TEXT,       -- Requester IP
  user_agent TEXT,       -- Requester browser/client

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON admin_audit_logs(resource_type);

-- Add comments
COMMENT ON TABLE admin_audit_logs IS 'Audit trail for all administrative actions';
COMMENT ON COLUMN admin_audit_logs.action IS 'Action type (uppercase snake_case)';
COMMENT ON COLUMN admin_audit_logs.details IS 'JSON object with action-specific details';

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on audit logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Service role can insert audit logs (backend only)
CREATE POLICY "Service role can insert audit logs"
  ON admin_audit_logs
  FOR INSERT
  WITH CHECK (true);  -- Backend uses service role key

-- Policy: No updates or deletes (immutable audit trail)
-- (No policies = no access)

-- =====================================================
-- 4. HELPER FUNCTION: GET USER ROLE
-- =====================================================

-- Function to easily check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role IN ('admin', 'super_admin')
  );
$$;

COMMENT ON FUNCTION is_admin IS 'Check if user has admin role';

-- =====================================================
-- 5. INITIAL ADMIN SETUP (OPTIONAL)
-- =====================================================

-- Grant admin role to first user (update email to your admin account)
-- UNCOMMENT AND RUN MANUALLY:

-- UPDATE profiles
-- SET role = 'super_admin'
-- WHERE id = (
--   SELECT id FROM auth.users
--   WHERE email = 'your-admin@email.com'
--   LIMIT 1
-- );

-- =====================================================
-- 6. VALIDATION & CONSTRAINTS
-- =====================================================

-- Add check constraint for valid roles
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('user', 'moderator', 'admin', 'super_admin'));

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if role column exists
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name = 'role';

-- Check audit logs table structure
-- \d admin_audit_logs

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'admin_audit_logs';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
-- Example: Log a user ban action
INSERT INTO admin_audit_logs (
  admin_id,
  admin_email,
  action,
  resource_type,
  resource_id,
  details,
  ip_address
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',  -- Admin user ID
  'admin@submarine.com',
  'USER_BAN',
  'user',
  '987e6543-e21b-12d3-a456-426614174001',  -- Banned user ID
  '{"reason": "Abuse", "duration": "permanent", "banned_by_nickname": "SuperAdmin"}'::jsonb,
  '192.168.1.1'
);

-- Example: Query recent admin actions
SELECT
  admin_email,
  action,
  resource_type,
  details->>'reason' AS reason,
  created_at
FROM admin_audit_logs
ORDER BY created_at DESC
LIMIT 10;

-- Example: Check if user is admin
SELECT is_admin('user-uuid-here');
*/
