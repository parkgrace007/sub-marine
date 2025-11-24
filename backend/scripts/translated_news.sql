-- ============================================
-- SubMarine: Translated News Table
-- ============================================
-- Purpose: Store translated crypto news to avoid re-translation
-- Max records: 40 (auto-cleanup via application)
-- ============================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS translated_news CASCADE;

-- Create translated_news table
CREATE TABLE translated_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  title_en TEXT,
  body_en TEXT,
  publisher_name TEXT,
  image TEXT,
  author TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  read_time INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE UNIQUE INDEX idx_translated_news_url ON translated_news(url);
CREATE INDEX idx_translated_news_published_at ON translated_news(published_at DESC);
CREATE INDEX idx_translated_news_created_at ON translated_news(created_at DESC);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_translated_news_updated_at
  BEFORE UPDATE ON translated_news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT 'Table created successfully!' AS status;
