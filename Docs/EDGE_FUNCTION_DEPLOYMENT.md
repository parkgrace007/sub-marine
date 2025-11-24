# Submarine Briefing Edge Function - Deployment Guide

**Created**: 2025-11-22
**Status**: ✅ Ready for deployment
**Purpose**: Generate AI-powered crypto market briefings every 4 hours

---

## 📋 Summary

This Edge Function automatically generates Korean-language crypto market briefings by analyzing real-time data from CoinGecko and leveraging Anthropic's Claude AI for insights.

### Key Features
- ⏰ **Scheduled**: Runs every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
- 📊 **Data Sources**: CoinGecko API (BTC/ETH prices, global market cap, trending coins)
- 🤖 **AI Analysis**: Anthropic Claude 3.5 Sonnet for market phase detection and Korean briefings
- 💾 **Storage**: Supabase `submarine_briefings` table
- 🎯 **Market Phases**: Risk On, Risk Off, Overheating, Neutral

---

## 📁 Files Created

### 1. Database Migration
**Location**: `backend/migrations/20251122_create_submarine_briefings.sql`

Creates table with schema:
```sql
CREATE TABLE submarine_briefings (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  market_phase TEXT CHECK (market_phase IN ('risk_on', 'risk_off', 'overheating', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Edge Function
**Location**: `supabase/functions/submarine-briefing/index.ts`

Main logic:
1. Fetch CoinGecko data (markets, global, trending)
2. Detect market phase based on BTC dominance, meme coin trends
3. Generate briefing with Claude API
4. Store in database

### 3. Configuration
**Location**: `supabase/config.toml`

Cron schedule:
```toml
[functions.submarine-briefing.schedule]
cron = "0 */4 * * *"
```

### 4. Documentation
- **README**: `supabase/functions/submarine-briefing/README.md`
- **Environment Template**: `supabase/functions/submarine-briefing/.env.example`

---

## 🚀 Deployment Steps

### Step 1: Database Setup

Run migration in Supabase Dashboard > SQL Editor:

```bash
# Copy from backend/migrations/20251122_create_submarine_briefings.sql
# Or run via psql if you have direct access
```

Verify table creation:
```sql
SELECT * FROM submarine_briefings LIMIT 1;
```

### Step 2: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 3: Login & Link Project

```bash
# Login to Supabase
supabase login

# Link to your project
cd /Users/heojunseog/Desktop/real_whale
supabase link --project-ref [your-project-ref]
```

**Find project ref**: Supabase Dashboard > Project Settings > General

### Step 4: Set Environment Variables

```bash
# Set Anthropic API key
supabase secrets set ANTHROPIC_API_KEY=[your-anthropic-api-key]
```

**Get Anthropic API Key**: https://console.anthropic.com/

### Step 5: Deploy Function

```bash
supabase functions deploy submarine-briefing
```

Expected output:
```
Deploying function submarine-briefing...
Function submarine-briefing deployed successfully!
Function URL: https://[project-ref].supabase.co/functions/v1/submarine-briefing
```

### Step 6: Verify Deployment

Check function status:
```bash
supabase functions list
```

Should show:
```
NAME                  STATUS    CREATED_AT
submarine-briefing    ACTIVE    2025-11-22T...
```

---

## 🧪 Testing

### Manual Trigger (CLI)

```bash
supabase functions invoke submarine-briefing
```

### Manual Trigger (HTTP)

```bash
curl -X POST \
  'https://[project-ref].supabase.co/functions/v1/submarine-briefing' \
  -H 'Authorization: Bearer [anon-key]'
```

### Expected Response

```json
{
  "success": true,
  "briefing": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "BTC 도미넌스 상승, 알트코인 약세 지속",
    "content": "## 시장 개요\n\n비트코인이...",
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

### Verify Database Storage

```sql
SELECT
  title,
  market_phase,
  created_at
FROM submarine_briefings
ORDER BY created_at DESC
LIMIT 1;
```

---

## 📊 Monitoring

### View Logs

Real-time logs:
```bash
supabase functions logs submarine-briefing --tail
```

Recent logs (last 100 lines):
```bash
supabase functions logs submarine-briefing
```

### Check Execution History

```sql
SELECT
  COUNT(*) as total_briefings,
  market_phase,
  DATE(created_at) as date
FROM submarine_briefings
GROUP BY market_phase, DATE(created_at)
ORDER BY date DESC;
```

---

## 🔧 Troubleshooting

### Issue: Function not executing on schedule

**Check**:
1. Verify cron configuration in `supabase/config.toml`
2. Redeploy function: `supabase functions deploy submarine-briefing`
3. Check Supabase Dashboard > Edge Functions > submarine-briefing > Settings

### Issue: "ANTHROPIC_API_KEY not configured"

**Solution**:
```bash
supabase secrets set ANTHROPIC_API_KEY=[your-key]
```

Verify:
```bash
supabase secrets list
```

### Issue: CoinGecko rate limit exceeded

**Symptoms**: Function fails with "429 Too Many Requests"

**Solutions**:
1. Wait 1 minute (free tier: 30 calls/min)
2. Upgrade to CoinGecko Pro (optional)
3. Current usage: 3 calls per execution (safe for 4-hour schedule)

### Issue: Claude API error

**Common causes**:
- Invalid API key → Check key in Anthropic Console
- Quota exceeded → Check usage at console.anthropic.com
- Rate limit → Wait and retry

### Issue: Database insertion fails

**Check**:
1. Table exists: `SELECT * FROM submarine_briefings LIMIT 1;`
2. RLS policies allow service role inserts:
```sql
SELECT * FROM pg_policies WHERE tablename = 'submarine_briefings';
```

---

## 💰 Cost Estimation

### Anthropic Claude API
- **Usage**: 1 call per 4 hours = 6 calls/day
- **Tokens**: ~500 tokens per call
- **Model**: claude-3-5-sonnet-latest
- **Cost**: ~$0.003/briefing × 6/day = **$0.018/day** (~$0.54/month)

### CoinGecko API
- **Tier**: Free (30 calls/min)
- **Usage**: 3 calls per 4 hours = 18 calls/day
- **Cost**: **$0/month** (well within free tier)

### Supabase
- **Storage**: Minimal (~1KB per briefing × 6/day × 30 days = ~180KB/month)
- **Function Invocations**: 6/day × 30 = 180/month
- **Cost**: **$0/month** (within free tier)

**Total**: ~**$0.54/month** (Anthropic API only)

---

## 📅 Schedule Reference

### UTC Time
- 00:00 (Midnight)
- 04:00 (Early Morning)
- 08:00 (Morning)
- 12:00 (Noon)
- 16:00 (Afternoon)
- 20:00 (Evening)

### KST Time (UTC+9)
- 09:00 (Morning)
- 13:00 (Early Afternoon)
- 17:00 (Late Afternoon)
- 21:00 (Evening)
- 01:00 (Late Night)
- 05:00 (Early Morning)

---

## 🎯 Market Phase Detection Logic

| Phase | Criteria | Interpretation |
|-------|----------|----------------|
| **overheating** | 3+ meme coins in top 5 trending | Euphoric, speculative excess |
| **risk_on** | Market cap ↑ + ETH outperforming BTC | Alt season, risk appetite |
| **risk_off** | BTC ↑ + ETH down >2% | Flight to safety, defensive |
| **neutral** | None of the above | Sideways, no clear trend |

---

## 📚 Resources

- **Detailed README**: `supabase/functions/submarine-briefing/README.md`
- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Anthropic API**: https://docs.anthropic.com/
- **CoinGecko API**: https://www.coingecko.com/en/api/documentation

---

## ✅ Deployment Checklist

- [ ] Database migration executed
- [ ] Supabase CLI installed
- [ ] Project linked via CLI
- [ ] `ANTHROPIC_API_KEY` secret set
- [ ] Function deployed successfully
- [ ] Manual test completed
- [ ] Database storage verified
- [ ] Logs monitored for first scheduled run
- [ ] Error handling tested

---

**Last Updated**: 2025-11-22
**Maintainer**: SubMarine Development Team
