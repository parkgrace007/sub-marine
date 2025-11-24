-- ================================================
-- ALERT SYSTEM TABLES FOR SUPABASE
-- ================================================
-- 실행 방법:
-- 1. https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new 접속
-- 2. 이 SQL 전체를 복사하여 붙여넣기
-- 3. "Run" 버튼 클릭
-- ================================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. ALERTS 테이블 (알림 저장)
-- ================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  signal_type TEXT NOT NULL,  -- 'S-001', 'S-002', 'A-001', etc.
  tier CHAR(1) NOT NULL,      -- 'S', 'A', 'B', 'C'
  timeframe TEXT,              -- '1h', '4h', '8h', '12h', '1d'
  symbol TEXT,                 -- 'BTC', 'ETH', etc.
  conditions JSONB,            -- JSON 형태의 상세 조건
  priority INTEGER DEFAULT 0,  -- 우선순위 (높을수록 중요)
  message TEXT NOT NULL,       -- 알림 메시지
  severity TEXT,               -- 'critical', 'high', 'medium', 'low'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (빠른 쿼리를 위해)
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_tier ON public.alerts(tier);
CREATE INDEX IF NOT EXISTS idx_alerts_signal_type ON public.alerts(signal_type);
CREATE INDEX IF NOT EXISTS idx_alerts_timeframe ON public.alerts(timeframe);

-- ================================================
-- 2. ALERT_HISTORY 테이블 (중복 방지)
-- ================================================
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  signal_hash TEXT UNIQUE NOT NULL,  -- 시그널 고유 해시
  signal_type TEXT NOT NULL,
  tier CHAR(1) NOT NULL,
  last_triggered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trigger_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_alert_history_hash ON public.alert_history(signal_hash);
CREATE INDEX IF NOT EXISTS idx_alert_history_last_triggered ON public.alert_history(last_triggered DESC);

-- ================================================
-- 3. RLS (Row Level Security) 정책
-- ================================================

-- RLS 활성화
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- Service Role 정책 (모든 권한)
CREATE POLICY "Service role full access alerts" ON public.alerts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access alert_history" ON public.alert_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anon Role 정책 (읽기 전용)
CREATE POLICY "Anon can read alerts" ON public.alerts
  FOR SELECT
  USING (true);

CREATE POLICY "Anon can read alert_history" ON public.alert_history
  FOR SELECT
  USING (true);

-- ================================================
-- 4. REALTIME 활성화 (선택사항)
-- ================================================
-- Supabase Dashboard에서 수동으로 활성화:
-- 1. Database > Replication 메뉴 이동
-- 2. alerts 테이블 찾기
-- 3. "0 active" 버튼 클릭
-- 4. Insert, Update, Delete 모두 활성화

-- ================================================
-- 5. 테스트 데이터 삽입 (선택사항)
-- ================================================
-- 테스트용 알림 몇 개 삽입
INSERT INTO public.alerts (signal_type, tier, timeframe, message, conditions, priority, severity)
VALUES
  ('S-002', 'S', '1h', 'PERFECT CONFLUENCE: RSI극단 + 대량 매수',
   '{"rsi": 15, "whale_weight": 55000000, "bb_position": "lower"}'::jsonb,
   100, 'critical'),

  ('A-002', 'A', '4h', 'WHALE MOMENTUM: 고래 매수 증가',
   '{"rsi": 32, "whale_weight": 35000000}'::jsonb,
   75, 'high'),

  ('B-003', 'B', '1h', 'NORMAL WHALE SELL 감지',
   '{"whale_weight": -25000000}'::jsonb,
   50, 'medium'),

  ('C-003', 'C', '1h', 'RSI OVERSOLD 신호',
   '{"rsi": 28}'::jsonb,
   25, 'low');

-- ================================================
-- 실행 완료 메시지
-- ================================================
-- 성공하면 다음과 같은 메시지가 나타납니다:
-- "Success. No rows returned" 또는 "Success. 4 rows affected"
-- ================================================