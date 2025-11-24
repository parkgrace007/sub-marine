# Submarine Briefing Edge Function

AI-powered crypto market briefing generator that runs every 4 hours.

## Overview

This Supabase Edge Function generates comprehensive Korean-language crypto market briefings by:
1. Fetching real-time data from CoinGecko API (BTC/ETH prices, global market cap, trending coins)
2. Analyzing market phase (Risk On/Off, Overheating, Neutral)
3. Generating insights using Anthropic Claude API (claude-3-5-sonnet-latest)
4. Storing briefings in `submarine_briefings` table

## Prerequisites

### 1. Database Setup
Run the migration to create the required table:

```bash
# Navigate to backend migrations
cd /Users/heojunseog/Desktop/real_whale/backend/migrations

# Run migration in Supabase SQL Editor or via psql:
psql -h [your-supabase-host] -U postgres -d postgres -f 20251122_create_submarine_briefings.sql
```

Or execute directly in Supabase Dashboard > SQL Editor:
```sql
-- Copy contents from backend/migrations/20251122_create_submarine_briefings.sql
```

### 2. Environment Variables
Configure in Supabase Dashboard > Project Settings > Edge Functions:

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | ✅ Yes |
| `SUPABASE_URL` | Auto-injected by Supabase | ✅ Auto |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase | ✅ Auto |

**Get Anthropic API Key**: https://console.anthropic.com/

## Deployment

### Using Supabase CLI

1. **Install Supabase CLI** (if not already installed):
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

3. **Link Project**:
```bash
cd /Users/heojunseog/Desktop/real_whale
supabase link --project-ref [your-project-ref]
```

4. **Deploy Function**:
```bash
supabase functions deploy submarine-briefing
```

5. **Set Environment Variables**:
```bash
supabase secrets set ANTHROPIC_API_KEY=[your-api-key]
```

### Verify Deployment

Check function status:
```bash
supabase functions list
```

View logs:
```bash
supabase functions logs submarine-briefing
```

## Testing

### Manual Trigger

#### Option 1: Supabase Dashboard
1. Go to Database > Functions
2. Find `submarine-briefing`
3. Click "Invoke"

#### Option 2: CLI
```bash
supabase functions invoke submarine-briefing
```

#### Option 3: HTTP Request
```bash
curl -X POST \
  'https://[your-project-ref].supabase.co/functions/v1/submarine-briefing' \
  -H 'Authorization: Bearer [anon-key]'
```

### Expected Response

Success response:
```json
{
  "success": true,
  "briefing": {
    "id": "uuid",
    "title": "BTC 도미넌스 상승, 알트코인 약세 지속",
    "content": "마크다운 본문...",
    "market_phase": "risk_off",
    "created_at": "2025-11-22T10:00:00Z"
  },
  "marketData": {
    "btcPrice": 95234,
    "ethPrice": 3456,
    "btcDominance": 54.2,
    "marketPhase": "risk_off"
  }
}
```

## Scheduling

The function runs automatically every 4 hours based on `supabase/config.toml`:

```toml
[functions.submarine-briefing.schedule]
cron = "0 */4 * * *"
```

**UTC Schedule**: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00

**KST Schedule** (UTC+9): 09:00, 13:00, 17:00, 21:00, 01:00, 05:00

## Market Phase Detection Logic

| Phase | Criteria |
|-------|----------|
| **overheating** | 3+ meme coins in top 5 trending |
| **risk_on** | Market cap ↑ + ETH outperforming BTC |
| **risk_off** | BTC ↑ + ETH down >2% |
| **neutral** | None of the above |

## API Rate Limits

### CoinGecko (Free Tier)
- **Limit**: 30 calls/minute
- **Usage**: 3 calls per execution (markets, global, trending)
- **Impact**: Safe for 4-hour schedule (10 executions/hour max)

### Anthropic Claude
- **Limit**: Depends on your plan
- **Usage**: 1 call per execution (~500 tokens)
- **Cost**: ~$0.003 per briefing (claude-3-5-sonnet-latest)

## Monitoring

### Check Latest Briefings
```sql
SELECT
  title,
  market_phase,
  created_at
FROM submarine_briefings
ORDER BY created_at DESC
LIMIT 5;
```

### View Execution Logs
```bash
supabase functions logs submarine-briefing --tail
```

### Error Handling
The function logs all errors to Supabase Edge Functions logs. Check for:
- CoinGecko API failures (rate limits, downtime)
- Anthropic API errors (invalid key, quota exceeded)
- Database insertion failures

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY not configured"
**Solution**: Set secret via CLI:
```bash
supabase secrets set ANTHROPIC_API_KEY=[your-key]
```

### Issue: CoinGecko rate limit exceeded
**Solution**:
- Wait 1 minute
- Consider upgrading to CoinGecko Pro (50 calls/min)
- Add retry logic with exponential backoff

### Issue: Claude response parsing failed
**Solution**: Check Claude API response format. May need to adjust JSON extraction regex in code.

### Issue: Database insertion error
**Solution**: Verify table exists and RLS policies allow service role inserts:
```sql
-- Check table exists
SELECT * FROM submarine_briefings LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'submarine_briefings';
```

## Development

### Local Testing (Deno)
```bash
cd supabase/functions/submarine-briefing
deno run --allow-net --allow-env index.ts
```

### Environment Variables for Local Testing
Create `.env` file:
```bash
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Architecture

```
┌─────────────────┐
│  Supabase Cron  │ (Every 4 hours)
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ submarine-briefing Edge │
│       Function          │
└────────┬────────────────┘
         │
         ├─► CoinGecko API (BTC/ETH/Global/Trending)
         │
         ├─► Anthropic Claude API (Generate briefing)
         │
         └─► Supabase Database (Store briefing)
                 │
                 ▼
         ┌──────────────────────┐
         │ submarine_briefings  │
         │      Table           │
         └──────────────────────┘
```

## Support

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Anthropic Docs**: https://docs.anthropic.com/
- **CoinGecko Docs**: https://www.coingecko.com/en/api/documentation
