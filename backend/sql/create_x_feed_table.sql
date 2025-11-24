-- ================================================
-- X INFLUENCER POSTS TABLE FOR SUPABASE
-- ================================================
-- 실행 방법:
-- 1. https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new 접속
-- 2. 이 SQL 전체를 복사하여 붙여넣기
-- 3. "Run" 버튼 클릭
-- ================================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- X_INFLUENCER_POSTS 테이블 (X 인플루언서 포스트 저장)
-- ================================================
CREATE TABLE IF NOT EXISTS public.x_influencer_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id TEXT UNIQUE NOT NULL,           -- X post ID (unique)
  text TEXT NOT NULL,                     -- Korean translated text
  text_en TEXT,                           -- Original English text
  author_id TEXT NOT NULL,                -- X author ID
  author_name TEXT NOT NULL,              -- Author display name
  author_username TEXT NOT NULL,          -- Author @username
  author_profile_image TEXT,              -- Profile image URL
  author_verified BOOLEAN DEFAULT FALSE,  -- Verified account badge
  likes INTEGER DEFAULT 0,                -- Like count
  retweets INTEGER DEFAULT 0,             -- Retweet count
  replies INTEGER DEFAULT 0,              -- Reply count
  quotes INTEGER DEFAULT 0,               -- Quote tweet count
  post_url TEXT NOT NULL,                 -- Full URL to post
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- When post was created on X
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- When added to our DB
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 인덱스 생성 (빠른 쿼리를 위해)
-- ================================================
CREATE INDEX IF NOT EXISTS idx_x_posts_post_id ON public.x_influencer_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_x_posts_posted_at ON public.x_influencer_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_x_posts_author_username ON public.x_influencer_posts(author_username);
CREATE INDEX IF NOT EXISTS idx_x_posts_likes ON public.x_influencer_posts(likes DESC);

-- ================================================
-- RLS (Row Level Security) 정책
-- ================================================

-- RLS 활성화
ALTER TABLE public.x_influencer_posts ENABLE ROW LEVEL SECURITY;

-- Service Role 정책 (모든 권한)
CREATE POLICY "Service role full access x_posts" ON public.x_influencer_posts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anon Role 정책 (읽기 전용)
CREATE POLICY "Anon can read x_posts" ON public.x_influencer_posts
  FOR SELECT
  USING (true);

-- ================================================
-- REALTIME 활성화 안내
-- ================================================
-- Supabase Dashboard에서 수동으로 활성화:
-- 1. Database > Replication 메뉴 이동
-- 2. x_influencer_posts 테이블 찾기
-- 3. "0 active" 버튼 클릭
-- 4. Insert, Update, Delete 모두 활성화

-- ================================================
-- 실행 완료 메시지
-- ================================================
-- 성공하면 다음과 같은 메시지가 나타납니다:
-- "Success. No rows returned"
-- ================================================
