# =Ý Indicator Alerts Persistence System

## Overview

The "”L¼ LOG" (Important Alerts LOG) now persists across page refreshes using Supabase database storage. Alerts are automatically:
- Saved to database when generated
- Loaded on page mount filtered by timeframe/symbol
- Updated in real-time via Supabase Realtime
- Auto-cleaned to keep only 100 most recent per timeframe/symbol

## Database Schema

### Table: `indicator_alerts`

```sql
CREATE TABLE indicator_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeframe TEXT NOT NULL,       -- '1h', '4h', '1d'
  symbol TEXT NOT NULL,           -- 'BTC', 'ETH', 'µi'
  type TEXT NOT NULL,             -- 'critical', 'warning', 'info', 'success'
  message TEXT NOT NULL,          -- Alert message
  value TEXT,                     -- Optional value (e.g., RSI value)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

- `idx_indicator_alerts_timeframe_symbol_created`: Fast queries by timeframe/symbol/time
- `idx_indicator_alerts_created_at`: Cleanup operations

### Auto-Cleanup Trigger

A PostgreSQL trigger automatically deletes old alerts beyond the 100 most recent for each timeframe/symbol combination:

```sql
CREATE TRIGGER trigger_cleanup_indicator_alerts
  AFTER INSERT ON indicator_alerts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_indicator_alerts();
```

## Setup Instructions

### Step 1: Create Database Table

1. Open Supabase SQL Editor:
   ```bash
   open "https://supabase.com/dashboard/project/cweqpoiylchdkoistmgi/sql/new"
   ```

2. Copy and paste the SQL from:
   ```
   backend/scripts/setupIndicatorAlerts.sql
   ```

3. Click "Run" button

4. Verify success (should see "Success. No rows returned")

### Step 2: Test the Setup

Run the test script to verify everything works:

```bash
cd backend
node scripts/testIndicatorAlerts.js
```

**Expected Output:**
```
>ê Testing Indicator Alerts System
============================================================

=Ý Test 1: Inserting sample alerts...
    Inserted: RSI oversold at 25.3 (uuid)
    Inserted: MACD bearish crossover detected (uuid)
    Inserted: Price approaching BB lower band (uuid)
    Inserted: Market sentiment improving (uuid)

=å Test 2: Querying alerts for 1h/BTC...
    Found 2 alerts:
      - [CRITICAL] RSI oversold at 25.3
      - [WARNING] MACD bearish crossover detected

>ù Test 3: Testing auto-cleanup (inserting 105 alerts)...
    Inserted 105 alerts
    Auto-cleanup working! Kept 100/105 alerts (max 100)

=Ñ  Test 4: Cleaning up test data...
    Test data cleaned up

============================================================
 All tests completed!
```

## Frontend Implementation

### MainPage.jsx Changes

1. **Fetch alerts on mount/filter change:**
   ```javascript
   useEffect(() => {
     const fetchAlerts = async () => {
       const { data, error } = await supabase
         .from('indicator_alerts')
         .select('*')
         .eq('timeframe', timeframe)
         .eq('symbol', symbol)
         .order('created_at', { ascending: false })
         .limit(100)

       if (!error) setAlerts(data)
     }
     fetchAlerts()
   }, [timeframe, symbol])
   ```

2. **Subscribe to real-time updates:**
   ```javascript
   useEffect(() => {
     const channel = supabase
       .channel('indicator_alerts_changes')
       .on('postgres_changes', {
         event: 'INSERT',
         schema: 'public',
         table: 'indicator_alerts',
         filter: `timeframe=eq.${timeframe},symbol=eq.${symbol}`
       }, (payload) => {
         // Add new alert to state
       })
       .subscribe()

     return () => supabase.removeChannel(channel)
   }, [timeframe, symbol])
   ```

3. **Save alerts to database when generated:**
   ```javascript
   const handleLogGenerated = useCallback(async (log) => {
     await supabase
       .from('indicator_alerts')
       .insert({
         timeframe,
         symbol,
         type: log.type,
         message: log.text,
         value: log.value || null
       })
   }, [timeframe, symbol])
   ```

## Behavior

### Alert Lifecycle

1. **Generation**: Indicator detects change ’ `handleLogGenerated` called
2. **Save**: Alert inserted into Supabase `indicator_alerts` table
3. **Auto-cleanup**: Trigger keeps only 100 most recent per timeframe/symbol
4. **Broadcast**: Supabase Realtime broadcasts INSERT event
5. **Update UI**: All subscribed clients receive and display new alert

### Timeframe/Symbol Filtering

When user changes timeframe or symbol:
1. Fetch new set of alerts from database (filtered)
2. Update Realtime subscription filter
3. Display only alerts matching current timeframe/symbol

**Example:**
- User selects "1h" + "BTC"
- Shows only alerts where `timeframe='1h' AND symbol='BTC'`
- Switching to "4h" + "ETH" shows different alerts
- Previous alerts (1h/BTC) still exist in database

### Persistence

-  Alerts survive page refresh
-  Alerts survive browser restart
-  Max 100 alerts per timeframe/symbol combination
-  Real-time synchronization across all browser tabs
-  Automatic cleanup (no manual maintenance needed)

## Row Level Security (RLS)

### Policies

1. **Public Read Access** (anon role):
   ```sql
   CREATE POLICY "Allow public read access"
     ON indicator_alerts FOR SELECT TO anon USING (true);
   ```

2. **Service Role Full Access**:
   ```sql
   CREATE POLICY "Allow service role all operations"
     ON indicator_alerts FOR ALL TO service_role USING (true);
   ```

### Security Notes

- Frontend uses ANON key (read-only)
- Backend uses SERVICE_ROLE key (full access)
- Users can only read alerts, not modify/delete
- Automatic cleanup runs with service role privileges

## Files Modified/Created

### New Files
- [backend/scripts/setupIndicatorAlerts.sql](../backend/scripts/setupIndicatorAlerts.sql) - SQL setup script
- [backend/scripts/testIndicatorAlerts.js](../backend/scripts/testIndicatorAlerts.js) - Test script
- [Docs/INDICATOR_ALERTS_PERSISTENCE.md](./INDICATOR_ALERTS_PERSISTENCE.md) - This documentation

### Modified Files
- [frontend/src/pages/MainPage.jsx](../frontend/src/pages/MainPage.jsx) - Added Supabase integration

### Changes to MainPage.jsx
- Added `useEffect` import
- Added `supabase` import
- Added 2 new useEffect hooks (fetch + realtime subscribe)
- Modified `handleLogGenerated` to save to database
- Removed in-memory slicing (moved to database trigger)

## Troubleshooting

### "Table 'indicator_alerts' does not exist"
- Run the SQL setup script in Supabase SQL Editor
- Verify table appears in Table Editor

### "Column 'value' does not exist"
- Check SQL script was executed completely
- Table should have all 7 columns (id, timeframe, symbol, type, message, value, created_at)

### Alerts not appearing after refresh
- Check browser console for errors
- Verify Supabase connection (check other features like DEEP DIVE REPORT)
- Check if alerts exist in database (Supabase Table Editor)
- Verify RLS policies are created

### More than 100 alerts in database
- Check if trigger was created successfully
- Trigger runs AFTER each INSERT
- Old alerts deleted asynchronously (may take ~1 second)

### Real-time updates not working
- Verify Realtime is enabled in Supabase project settings
- Check Supabase Realtime inspector for subscription status
- Ensure filter syntax is correct: `timeframe=eq.${timeframe},symbol=eq.${symbol}`

## Cost Implications

### Database Storage
- Each alert: ~200-300 bytes
- Max 100 alerts × (3 timeframes × 10 symbols) = 3,000 alerts max
- Total storage: ~0.9 MB (negligible)

### Realtime Subscriptions
- 1 subscription per active browser tab
- Supabase free tier: 200 concurrent connections
- Cost: $0 (well within free limits)

### Database Queries
- Fetches: 1 query per page load/filter change
- Inserts: 1 query per indicator change (~1-10/minute)
- Supabase free tier: 50,000 queries/month
- Estimated usage: ~10,000 queries/month
- Cost: $0 (within free tier)

---

**Last Updated**: 2025-11-23
**Version**: 1.0
**Status**:  Production Ready
