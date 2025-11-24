-- ========================================
-- USER PROFILES TABLE
-- ========================================
-- Supabase auth.users와 1:1 관계
-- 닉네임 등 추가 사용자 정보 저장
-- ========================================

-- 1. profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);

-- 3. RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 사용자는 자신의 프로필만 조회/수정 가능
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5. Service Role은 모든 권한
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;
CREATE POLICY "Service role full access profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Trigger Function: auth.users 생성 시 profiles 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 닉네임 자동 생성: user_<random 6자리>
  INSERT INTO public.profiles (id, nickname, avatar_url)
  VALUES (
    NEW.id,
    'user_' || substring(md5(random()::text) from 1 for 6),
    NEW.raw_user_meta_data->>'avatar_url' -- Google 프로필 이미지
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger 생성: auth.users INSERT 시 자동 실행
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor로 이동
-- 2. 이 스크립트를 붙여넣고 실행
-- 3. Google OAuth 설정 완료 후 테스트
-- ========================================
