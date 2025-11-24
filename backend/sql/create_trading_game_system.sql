-- ========================================
-- TRADING GAME SYSTEM - DB SCHEMA
-- Created: 2025-11-23
-- Purpose: 로그인 기반 트레이딩 게임 시스템 구축
-- ========================================

-- ========================================
-- 1. PROFILES 테이블 확장
-- ========================================

-- 게임 관련 컬럼 추가
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trading_balance DECIMAL(20, 2) DEFAULT 10000 CHECK (trading_balance >= 0),
ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(20, 2) DEFAULT 10000,
ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS winning_trades INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pnl DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS all_time_high_balance DECIMAL(20, 2) DEFAULT 10000,
ADD COLUMN IF NOT EXISTS max_drawdown DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_trade_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trading_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 인덱스 추가 (랭킹 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_trading_balance ON public.profiles(trading_balance DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_pnl ON public.profiles(total_pnl DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_win_rate ON public.profiles((winning_trades::float / NULLIF(total_trades, 0)) DESC NULLS LAST);

-- 컬럼 설명
COMMENT ON COLUMN public.profiles.trading_balance IS '현재 트레이딩 잔액 (가상 USDT)';
COMMENT ON COLUMN public.profiles.initial_balance IS '초기 지급 잔액 (기본 10,000)';
COMMENT ON COLUMN public.profiles.total_trades IS '총 거래 횟수';
COMMENT ON COLUMN public.profiles.winning_trades IS '수익 거래 횟수';
COMMENT ON COLUMN public.profiles.total_pnl IS '누적 손익 (USDT)';
COMMENT ON COLUMN public.profiles.all_time_high_balance IS '역대 최고 잔액';
COMMENT ON COLUMN public.profiles.max_drawdown IS '최대 낙폭 (%)';
COMMENT ON COLUMN public.profiles.last_trade_at IS '마지막 거래 시간';
COMMENT ON COLUMN public.profiles.trading_started_at IS '트레이딩 시작 시간';

-- ========================================
-- 2. TRADING_HISTORY 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS public.trading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 거래 정보
  symbol TEXT NOT NULL DEFAULT 'BTCUSDT',
  side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
  action TEXT NOT NULL CHECK (action IN ('OPEN', 'CLOSE', 'PARTIAL_CLOSE', 'LIQUIDATION')),

  -- 가격 정보
  entry_price DECIMAL(20, 2),
  exit_price DECIMAL(20, 2),
  size DECIMAL(20, 8) NOT NULL,
  leverage INTEGER NOT NULL,

  -- 손익 정보
  pnl DECIMAL(20, 2) DEFAULT 0,
  roe DECIMAL(10, 4) DEFAULT 0,
  fee DECIMAL(20, 2) DEFAULT 0,

  -- 메타데이터
  margin_mode TEXT DEFAULT 'ISOLATED' CHECK (margin_mode IN ('ISOLATED', 'CROSS')),
  position_id TEXT, -- 클라이언트 측 포지션 ID
  closed_percentage DECIMAL(5, 2) DEFAULT 100, -- 부분 청산 시 청산 비율

  -- 타임스탬프
  opened_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_history_user_id ON public.trading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_history_user_created ON public.trading_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_history_symbol ON public.trading_history(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_history_pnl ON public.trading_history(pnl DESC);

-- RLS 활성화
ALTER TABLE public.trading_history ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 자신의 거래 기록만 조회/삽입
DROP POLICY IF EXISTS "Users can view their own trading history" ON public.trading_history;
CREATE POLICY "Users can view their own trading history"
  ON public.trading_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trading history" ON public.trading_history;
CREATE POLICY "Users can insert their own trading history"
  ON public.trading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 3. 최대 1000개 제한 TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION public.limit_trading_history()
RETURNS TRIGGER AS $$
DECLARE
  record_count INTEGER;
BEGIN
  -- 현재 유저의 거래 기록 개수 확인
  SELECT COUNT(*) INTO record_count
  FROM public.trading_history
  WHERE user_id = NEW.user_id;

  -- 1000개 초과 시 가장 오래된 기록 삭제
  IF record_count >= 1000 THEN
    DELETE FROM public.trading_history
    WHERE id IN (
      SELECT id FROM public.trading_history
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT (record_count - 999)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trading_history_insert ON public.trading_history;
CREATE TRIGGER on_trading_history_insert
  AFTER INSERT ON public.trading_history
  FOR EACH ROW EXECUTE FUNCTION public.limit_trading_history();

-- ========================================
-- 4. 신규 유저 초기 잔액 지급 TRIGGER 수정
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nickname,
    avatar_url,
    trading_balance,
    initial_balance,
    all_time_high_balance,
    trading_started_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(SPLIT_PART(NEW.email, '@', 1), 'user_' || substring(md5(random()::text) from 1 for 6)),
    NEW.raw_user_meta_data->>'avatar_url',
    10000, -- 초기 지급
    10000,
    10000,
    NOW(),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger가 이미 존재하면 재생성하지 않음 (기존 유지)
-- 만약 새로 생성이 필요하면 아래 주석 해제:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 5. 완료
-- ========================================

-- 스키마 생성 완료 확인
DO $$
BEGIN
  RAISE NOTICE '✅ Trading game system schema created successfully!';
  RAISE NOTICE '📊 profiles 테이블에 게임 컬럼 추가 완료';
  RAISE NOTICE '📜 trading_history 테이블 생성 완료';
  RAISE NOTICE '🔒 RLS 정책 설정 완료';
  RAISE NOTICE '⚡ Trigger 함수 설정 완료';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. Supabase Dashboard에서 이 스크립트 실행';
  RAISE NOTICE '2. Frontend 코드 수정 (AuthContext, tradingStore 등)';
  RAISE NOTICE '3. 테스트: 신규 가입 시 10,000 USDT 지급 확인';
END $$;
