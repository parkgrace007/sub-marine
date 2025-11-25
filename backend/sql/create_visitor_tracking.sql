-- =====================================================
-- Visitor Tracking System
-- 실시간 접속자 및 방문 기록 추적
-- Created: 2025-11-25
-- =====================================================

-- 1. visitor_logs 테이블 생성
-- 방문 기록 저장 (30일 보관)
CREATE TABLE IF NOT EXISTS visitor_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 방문자 식별
  visitor_id TEXT NOT NULL,              -- 익명 방문자 ID (브라우저 fingerprint 또는 UUID)
  user_id UUID REFERENCES auth.users(id), -- 로그인 사용자 (NULL 가능)

  -- 방문 정보
  page_path TEXT NOT NULL,               -- 방문 페이지 경로
  referrer TEXT,                         -- 유입 경로
  user_agent TEXT,                       -- 브라우저 정보

  -- 위치 정보 (IP 기반, 선택사항)
  country TEXT,
  city TEXT,

  -- 세션 정보
  session_id TEXT NOT NULL,              -- 세션 ID
  is_new_session BOOLEAN DEFAULT true,   -- 새 세션 여부

  -- 타임스탬프
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visited_at ON visitor_logs(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_id ON visitor_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_session_id ON visitor_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_page_path ON visitor_logs(page_path);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_user_id ON visitor_logs(user_id) WHERE user_id IS NOT NULL;

-- 3. active_sessions 테이블 (실시간 접속자 추적)
-- Presence 백업용 + 상세 정보 저장
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 세션 식별
  session_id TEXT UNIQUE NOT NULL,
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),

  -- 현재 상태
  current_page TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- 타임스탬프
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON active_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON active_sessions(last_seen_at DESC);

-- 5. RLS 정책 설정
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- visitor_logs: 서비스 롤만 쓰기 가능, admin만 읽기 가능
DROP POLICY IF EXISTS "Service role can insert visitor_logs" ON visitor_logs;
CREATE POLICY "Service role can insert visitor_logs"
  ON visitor_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read visitor_logs" ON visitor_logs;
CREATE POLICY "Admin can read visitor_logs"
  ON visitor_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- active_sessions: 서비스 롤만 전체 권한, admin만 읽기 가능
DROP POLICY IF EXISTS "Service role full access active_sessions" ON active_sessions;
CREATE POLICY "Service role full access active_sessions"
  ON active_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read active_sessions" ON active_sessions;
CREATE POLICY "Admin can read active_sessions"
  ON active_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 6. 자동 정리 함수 (30일 이상 된 로그 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_visitor_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 30일 이상 된 방문 로그 삭제
  DELETE FROM visitor_logs
  WHERE visited_at < NOW() - INTERVAL '30 days';

  -- 2시간 이상 비활성 세션 정리
  UPDATE active_sessions
  SET is_active = false, disconnected_at = NOW()
  WHERE is_active = true
  AND last_seen_at < NOW() - INTERVAL '2 minutes';

  -- 7일 이상 된 비활성 세션 삭제
  DELETE FROM active_sessions
  WHERE is_active = false
  AND disconnected_at < NOW() - INTERVAL '7 days';
END;
$$;

-- 7. 통계 뷰 생성
CREATE OR REPLACE VIEW visitor_stats AS
SELECT
  DATE(visited_at) as date,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(*) as total_pageviews,
  COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id END) as logged_in_users
FROM visitor_logs
WHERE visited_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(visited_at)
ORDER BY date DESC;

-- 8. 페이지별 통계 뷰
CREATE OR REPLACE VIEW page_stats AS
SELECT
  page_path,
  COUNT(*) as views,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as sessions
FROM visitor_logs
WHERE visited_at > NOW() - INTERVAL '24 hours'
GROUP BY page_path
ORDER BY views DESC;

-- 9. 실시간 접속자 수 함수
CREATE OR REPLACE FUNCTION get_active_visitor_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM active_sessions
  WHERE is_active = true
  AND last_seen_at > NOW() - INTERVAL '2 minutes';
$$;

-- 10. Realtime 활성화 (Presence용)
-- Supabase Dashboard에서 수동으로 활성화 필요
-- Database > Replication > active_sessions 테이블 체크

COMMENT ON TABLE visitor_logs IS '방문자 로그 - 30일 보관';
COMMENT ON TABLE active_sessions IS '실시간 활성 세션';
