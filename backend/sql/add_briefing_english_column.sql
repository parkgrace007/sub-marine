-- Add English content column to market_briefings table
-- This enables bilingual briefing support (Korean + English)

-- Add content_en column if it doesn't exist
ALTER TABLE market_briefings
ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Add comment for documentation
COMMENT ON COLUMN market_briefings.content_en IS 'English version of the market briefing content';
