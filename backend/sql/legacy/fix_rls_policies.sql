-- ========================================
-- FIX RLS POLICIES FOR PUBLIC READ ACCESS
-- ========================================
-- 구글 로그인 구현 후 발생한 데이터 로드 문제 해결
-- 모든 사용자(인증/비인증)가 고래 데이터, 알림, 뉴스를 읽을 수 있도록 설정
-- ========================================

-- 1. whale_events 테이블: 모든 사용자 읽기 허용
ALTER TABLE public.whale_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to whale_events" ON public.whale_events;
CREATE POLICY "Allow public read access to whale_events"
  ON public.whale_events FOR SELECT
  USING (true);

-- 2. indicator_alerts 테이블: 모든 사용자 읽기 허용
ALTER TABLE public.indicator_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to indicator_alerts" ON public.indicator_alerts;
CREATE POLICY "Allow public read access to indicator_alerts"
  ON public.indicator_alerts FOR SELECT
  USING (true);

-- 3. news_articles 테이블 (있다면): 모든 사용자 읽기 허용
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_articles') THEN
    EXECUTE 'ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Allow public read access to news_articles" ON public.news_articles';
    EXECUTE 'CREATE POLICY "Allow public read access to news_articles" ON public.news_articles FOR SELECT USING (true)';
  END IF;
END
$$;

-- 4. market_briefings 테이블 (있다면): 모든 사용자 읽기 허용
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'market_briefings') THEN
    EXECUTE 'ALTER TABLE public.market_briefings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Allow public read access to market_briefings" ON public.market_briefings';
    EXECUTE 'CREATE POLICY "Allow public read access to market_briefings" ON public.market_briefings FOR SELECT USING (true)';
  END IF;
END
$$;

-- ========================================
-- 확인 쿼리 (선택사항)
-- ========================================
-- 아래 쿼리를 실행하여 RLS 정책이 올바르게 설정되었는지 확인
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- ========================================
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor로 이동
-- 2. 이 스크립트를 붙여넣고 실행
-- 3. Frontend 새로고침 (Ctrl+R 또는 Cmd+R)
-- ========================================
