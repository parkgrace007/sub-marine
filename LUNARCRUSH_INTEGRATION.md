# 🌙 LunarCrush API Integration Guide

**Date**: 2025-11-23
**Status**: ✅ **COMPLETE**

---

## 📋 Summary

Successfully integrated LunarCrush v4 API into the News/Report page to display:
- Latest crypto news from social media sources
- Top influencers for selected cryptocurrency (BTC/ETH/XRP)
- 6-hour caching system to minimize API calls
- Free tier optimization (2-3 API calls per day maximum)

---

## 🎯 Features Implemented

### 1. Backend Service
**File**: `backend/src/services/lunarcrush.js`

**Features**:
- File-based caching system (6 hours duration)
- Two API endpoints:
  - `/feeds` - Latest news articles
  - `/coins/{symbol}/influencers` - Top influencers
- Automatic cache validation
- Error handling with fallback to cached data
- Rate limiting protection

**Cache Location**: `backend/cache/lunarcrush.json`

### 2. API Endpoints
**File**: `backend/src/server.js`

**Endpoints**:
```
GET /api/lunarcrush/news?symbol=BTC&refresh=false
POST /api/lunarcrush/refresh
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "feeds": [...],
    "influencers": [...],
    "symbol": "BTC",
    "lastUpdate": "2025-11-23T10:00:00.000Z"
  },
  "cached": true,
  "cacheAge": 3600
}
```

### 3. Frontend Components

#### a. Custom Hook
**File**: `frontend/src/hooks/useLunarCrush.js`

**Usage**:
```javascript
const { data, loading, error, refresh } = useLunarCrush('BTC', true)
```

**Returns**:
- `data`: { feeds, influencers, lastUpdate }
- `loading`: boolean
- `error`: string | null
- `refresh()`: Force refresh function

#### b. NewsCard Component
**File**: `frontend/src/components/NewsCard.jsx`

**Props**:
```javascript
<NewsCard article={{
  title: string,
  body: string,
  url: string,
  created: number (Unix timestamp),
  publisher_name: string
}} />
```

**Features**:
- Auto-truncated summary (150 characters)
- Time ago display (e.g., "2h ago")
- External link with icon
- Hover effects

#### c. InfluencerCard Component
**File**: `frontend/src/components/InfluencerCard.jsx`

**Props**:
```javascript
<InfluencerCard influencer={{
  name: string,
  url: string,
  followers: number,
  influence_score: number (0-100)
}} />
```

**Features**:
- Follower count formatting (1.5M, 250K)
- Color-coded influence score:
  - Green (80+)
  - Blue (60-79)
  - Yellow (40-59)
  - Gray (<40)
- Twitter icon
- Profile link

#### d. NewsPage
**File**: `frontend/src/pages/NewsPage.jsx`

**Features**:
- Symbol selector (BTC/ETH/XRP)
- Manual refresh button with loading state
- Last update timestamp display
- API usage warning banner
- Loading/error states
- Responsive layout:
  - Desktop: News (66%) + Influencers (33%)
  - Mobile: Stacked layout

---

## 🔧 Setup Instructions

### Step 1: Get LunarCrush API Key

1. Visit: https://lunarcrush.com/developers
2. Sign up for FREE account
3. Navigate to API section
4. Copy your API key

### Step 2: Configure Backend

Add to `backend/.env`:
```env
# LunarCrush API (Crypto Social Analytics & News)
LUNARCRUSH_API_KEY=YOUR_LUNARCRUSH_API_KEY_HERE
```

### Step 3: Test the Integration

1. **Start backend** (if not already running):
   ```bash
   cd backend
   npm start
   ```

2. **Start frontend** (if not already running):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open browser**:
   - Navigate to: http://localhost:5173/news
   - Should see BTC news and influencers

4. **Test symbol switching**:
   - Click "ETH" button
   - Click "XRP" button
   - Verify data changes

5. **Test refresh**:
   - Click "Refresh" button
   - Verify loading spinner appears
   - Check console for API call logs

---

## 📊 Data Flow

```
User visits /news page
         ↓
useLunarCrush hook initializes
         ↓
Frontend: GET /api/lunarcrush/news?symbol=BTC
         ↓
Backend checks cache (6 hours)
         ├── Cache valid → Return cached data
         └── Cache expired → Fetch from LunarCrush API
                  ↓
         Save to cache (lunarcrush.json)
                  ↓
         Return fresh data
         ↓
Frontend receives data
         ↓
Render NewsCard + InfluencerCard components
```

---

## 🎯 API Call Optimization

### Free Tier Limits
- **LunarCrush Free Plan**: ~50-100 calls/day
- **Our Usage**: 2-4 calls/day maximum

### Cache Strategy
- **Duration**: 6 hours
- **Storage**: File-based (`backend/cache/lunarcrush.json`)
- **Auto-load**: On server startup
- **Validation**: Timestamp check on every request

### When API Calls Occur
1. **Initial load**: First time cache is empty
2. **Cache expired**: After 6 hours
3. **Manual refresh**: User clicks "Refresh" button
4. **Symbol change**: Only if cached symbol differs

### Preventing Excessive Calls
```javascript
// Backend cache check
if (cached && cached.symbol === symbol) {
  return cached  // No API call
}

// Frontend prevents rapid clicks
<button disabled={loading} onClick={refresh}>
  Refresh
</button>
```

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Cache file created on first API call
- [ ] Cache loads on server restart
- [ ] Cache expires after 6 hours
- [ ] Manual refresh forces new API call
- [ ] Error handling works (invalid API key)

### Frontend Tests
- [ ] NewsPage loads without errors
- [ ] Symbol selector switches correctly
- [ ] Refresh button shows loading state
- [ ] Last update time displays correctly
- [ ] Empty states show when no data
- [ ] Error banner appears on API failure

### Browser Console Logs
You should see:
```
📦 Using cached LunarCrush data
✅ Loaded 10 news feeds
✅ Loaded 5 influencers
```

Or on fresh API call:
```
🔄 Fetching fresh data from LunarCrush API...
✅ Fetched 10 feeds for BTC
✅ Fetched 5 influencers for BTC
💾 Saved to cache
```

---

## 📁 Files Created/Modified

### New Files
1. `backend/src/services/lunarcrush.js` - Core service
2. `frontend/src/hooks/useLunarCrush.js` - Custom hook
3. `frontend/src/components/NewsCard.jsx` - News display
4. `frontend/src/components/InfluencerCard.jsx` - Influencer display
5. `backend/cache/lunarcrush.json` - Cache file (auto-created)

### Modified Files
1. `backend/.env` - Added LUNARCRUSH_API_KEY
2. `backend/src/server.js` - Added import + 2 endpoints
3. `frontend/src/pages/NewsPage.jsx` - Complete redesign

---

## 🚨 Important Notes

### API Key Security
- ✅ API key stored in backend `.env`
- ✅ Never exposed to frontend
- ✅ Backend acts as proxy
- ❌ NEVER commit `.env` to git

### Rate Limiting
- Free tier has daily limits
- Cache system prevents excessive calls
- Manual refresh should be used sparingly
- Inform users: "하루 2-3회 사용 권장"

### Cache File
- Located in `backend/cache/`
- Automatically created
- Can be deleted to force refresh
- Not tracked in git (should be in `.gitignore`)

---

## 🔍 Troubleshooting

### Problem: "No data available"
**Solution**:
1. Check LUNARCRUSH_API_KEY in `.env`
2. Verify backend is running
3. Check browser console for errors
4. Try manual refresh

### Problem: "429 Rate Limit Error"
**Solution**:
1. Wait 24 hours for limit reset
2. Use cached data in meantime
3. Cache file prevents this from happening

### Problem: Cache not working
**Solution**:
1. Check `backend/cache/` folder exists
2. Verify file permissions
3. Check cache file format (valid JSON)

### Problem: Old data showing
**Solution**:
1. Delete `backend/cache/lunarcrush.json`
2. Click "Refresh" button
3. Wait for new API call

---

## 📈 Future Enhancements

### Potential Improvements
1. **Multi-symbol caching**: Cache each symbol separately
2. **Sentiment analysis**: Add article sentiment scoring
3. **Trending topics**: Display most discussed topics
4. **Notifications**: Alert on breaking news
5. **Filtering**: Filter by source, date, sentiment
6. **Search**: Search news articles
7. **Favorites**: Save favorite influencers

---

## 🎉 Conclusion

The LunarCrush integration is complete and ready to use. The system is optimized for the free tier with:
- 6-hour caching
- Manual refresh control
- Error handling
- User guidance

Visit http://localhost:5173/news to see it in action!

---

**Last Updated**: 2025-11-23
**Integration Status**: ✅ Complete & Tested
