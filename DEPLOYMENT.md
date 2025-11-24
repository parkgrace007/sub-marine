# SubMarine - Deployment Guide

Last Updated: 2025-11-24

## Overview

This document provides comprehensive deployment instructions for the SubMarine crypto whale tracking application.

---

## Pre-Deployment Checklist

### 1. Environment Variables Configuration

#### Backend (.env)
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Whale Alert API
WHALE_ALERT_API_KEY=your-whale-alert-api-key-here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Cron Job Settings
SWSI_CRON_INTERVAL=300
WHALE_FETCH_INTERVAL=5

# Admin Token (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ADMIN_TOKEN=your-64-character-hex-token-here
```

#### Frontend (.env.production)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL (production backend URL)
VITE_API_URL=https://your-backend-domain.onrender.com

# Development Settings
VITE_DEV_MODE=false
```

### 2. Security Checklist

- [x] CORS configured with production domain whitelist
- [x] Rate limiting enabled (100 req/15min public, 60 req/min realtime)
- [x] ADMIN_TOKEN uses timing-safe comparison (crypto.timingSafeEqual)
- [x] All API keys secured in environment variables
- [x] .env files added to .gitignore
- [x] No hardcoded URLs in frontend code

### 3. Performance Optimizations

- [x] Code splitting implemented (vendor chunks: react, supabase, charts, axios)
- [x] Lazy loading for non-critical pages (admin, trading, events, news, guide)
- [x] Production build optimized (~212 KB gzip initial load)
- [x] Vite build configuration tuned

### 4. CORS Configuration

The backend server is configured to allow only specific origins in production:

**Production Allowed Origins** (backend/src/server.js:20-50):
- https://submarine.app
- https://www.submarine.app
- https://real-whale.onrender.com

**Update these values** in server.js before deployment if your production domain is different.

---

## Deployment Steps

### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git status

# Build frontend to verify no errors
cd frontend
npm run build

# Verify backend runs without errors
cd ../backend
npm start
```

### Step 2: Configure Production Environment

#### Backend Deployment (Render.com)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure build settings:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node 18+
4. Add environment variables from backend `.env.example`
5. **IMPORTANT**: Update CORS origins in `backend/src/server.js` with your actual production domain

#### Frontend Deployment (Vercel/Netlify)

1. Create new project
2. Connect GitHub repository
3. Configure build settings:
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`
4. Add environment variables from frontend `.env.example`
5. Set `VITE_API_URL` to your backend production URL

### Step 3: Verify Deployment

Test the following after deployment:

1. **Frontend Loads**
   - Main page renders correctly
   - No console errors
   - All assets load (images, fonts, icons)

2. **API Connectivity**
   - Whale alerts display
   - Real-time updates work
   - Admin login functions (if applicable)

3. **CORS Verification**
   ```bash
   curl -H "Origin: https://your-frontend-domain.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://your-backend-domain.com/api/health
   ```

4. **Rate Limiting**
   ```bash
   # Should succeed
   curl https://your-backend-domain.com/api/health

   # After 100 requests in 15 minutes, should return 429
   ```

---

## Render-Specific Deployment Guide

### Environment Variable Setup on Render

#### Frontend Service (Static Site)

1. **Go to Render Dashboard** → Your Frontend Service → **Environment** tab
2. **Add the following environment variables**:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (your anon key)
VITE_API_URL=https://your-backend.onrender.com
VITE_DEV_MODE=false
```

3. **IMPORTANT**: After adding/changing environment variables:
   - Click **Manual Deploy** → **Clear build cache & deploy**
   - Vite embeds env vars at **BUILD TIME**, not runtime
   - Any change requires a full rebuild

#### Backend Service (Web Service)

1. **Go to Render Dashboard** → Your Backend Service → **Environment** tab
2. **Add the following environment variables**:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs... (service role key, NOT anon key)
WHALE_ALERT_API_KEY=your-whale-alert-api-key
ADMIN_TOKEN=your-secure-admin-token (min 32 chars)
NODE_ENV=production

# Optional (with defaults)
PORT=3000
ALLOWED_ORIGINS=https://your-frontend.onrender.com,https://yourdomain.com
```

3. **Save** and the backend will automatically restart (no rebuild needed)

### Pre-Deployment Verification

Before deploying, run the verification script to check all environment variables:

```bash
# Check backend environment variables
node backend/scripts/verifyDeployment.js backend

# Check frontend environment variables
node backend/scripts/verifyDeployment.js frontend
```

**Expected Output**:
```
🚀 SubMarine Deployment Verification

📋 Checking BACKEND environment variables...

✅ https://xxxxx.supabase.co...          SUPABASE_URL
   Supabase project URL

✅ eyJhbGciOiJIUzI1NiIsInR5cCI6...      SUPABASE_SERVICE_KEY
   Supabase service role key (long JWT token)

✅ DEPLOYMENT READY - All checks passed
```

### Database Connection Troubleshooting

If your deployment shows no data or database errors:

#### Step 1: Use Diagnostic Endpoints

**Test Database Connection**:
```bash
curl https://your-backend.onrender.com/api/diagnostic/test-db
```

**Expected Response** (success):
```json
{
  "timestamp": "2025-11-24T...",
  "success": true,
  "environment": {
    "nodeEnv": "production",
    "hasSupabaseUrl": true,
    "hasServiceKey": true
  },
  "tables": {
    "whale_events": {
      "accessible": true,
      "totalCount": 1234,
      "sampleData": [...]
    }
  }
}
```

**Failure Response** (indicates issue):
```json
{
  "success": false,
  "errors": [
    {
      "table": "whale_events",
      "error": "JWT expired"
    }
  ]
}
```

**Health Check**:
```bash
curl https://your-backend.onrender.com/api/diagnostic/health
```

**Environment Variables Check**:
```bash
curl https://your-backend.onrender.com/api/diagnostic/env
```

#### Step 2: Common Issues & Fixes

**Issue 1: Frontend shows "Database Connection Error"**

**Symptoms**:
- Frontend displays red error banner
- Browser console shows connection errors
- No whale data or alerts display

**Diagnosis**:
```bash
# 1. Open browser DevTools → Console
# 2. Look for Supabase connection test logs:
🔍 Testing Supabase connection...
   SUPABASE_URL: undefined  ❌ BAD
   ANON_KEY: MISSING        ❌ BAD
```

**Fix**:
1. Verify environment variables in Render Dashboard (Frontend service)
2. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Click **Manual Deploy** → **Clear build cache & deploy**
4. Wait for deployment to complete
5. Refresh browser with hard reload (Cmd+Shift+R / Ctrl+Shift+R)

**Issue 2: Backend can't connect to Supabase**

**Symptoms**:
- Diagnostic endpoint returns errors
- Backend logs show Supabase errors
- "JWT expired" or "Invalid API key" errors

**Diagnosis**:
```bash
curl https://your-backend.onrender.com/api/diagnostic/test-db
```

**Fix**:
1. Go to Render Dashboard → Backend Service → Environment
2. Verify `SUPABASE_SERVICE_KEY` is the **service role key** (not anon key)
   - Get from: Supabase Dashboard → Settings → API → Service Role Key
3. Verify `SUPABASE_URL` matches your project URL
4. Save changes (backend restarts automatically)
5. Test again with diagnostic endpoint

**Issue 3: CORS Errors**

**Symptoms**:
- Browser console shows: "blocked by CORS policy"
- Network tab shows preflight OPTIONS request fails
- API calls return no data

**Diagnosis**:
```bash
# Check browser DevTools → Network tab
# Look for OPTIONS requests with status 0 or 403
```

**Fix**:
1. Go to Render Dashboard → Backend Service → Environment
2. Add `ALLOWED_ORIGINS` environment variable:
   ```
   ALLOWED_ORIGINS=https://your-frontend.onrender.com
   ```
3. Or update hardcoded origins in `backend/src/server.js:40-45`
4. Save and restart backend

**Issue 4: Realtime Updates Not Working**

**Symptoms**:
- Initial data loads but no live updates
- New whale alerts don't appear
- Console shows WebSocket disconnected

**Diagnosis**:
```bash
# Check browser console for:
Realtime subscription status: CHANNEL_ERROR
```

**Fix**:
1. Verify RLS policies in Supabase:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT tablename, policyname, roles::text
   FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename IN ('whale_events', 'indicator_alerts');
   ```
2. Expected: Policies with `{anon,authenticated}` roles
3. If missing, run: `backend/sql/emergency_rls_fix.sql`

### Render-Specific Gotchas

**1. Cold Starts (Free Tier)**
- **Issue**: First request takes 30-60 seconds
- **Impact**: Frontend may timeout
- **Solution**: Keep backend warm with ping service or upgrade to paid plan

**2. Build Cache Issues**
- **Issue**: Environment variable changes not reflected
- **Solution**: Always use "Clear build cache & deploy"

**3. Static Site Routing (Frontend)**
- **Issue**: Direct URL navigation returns 404
- **Solution**: Add `_redirects` file (already configured):
   ```
   /* /index.html 200
   ```

**4. Environment Variables Case Sensitivity**
- **Issue**: `vite_supabase_url` won't work
- **Solution**: Must be uppercase: `VITE_SUPABASE_URL`

### Monitoring Deployed Application

**1. Backend Logs**:
```bash
# View in Render Dashboard → Backend Service → Logs
# Or use Render CLI
render logs -s your-backend-service
```

**2. Frontend Error Tracking**:
- Open browser DevTools → Console
- Look for red error messages
- Check Network tab for failed requests

**3. Database Metrics**:
- Supabase Dashboard → Project → Database → Reports
- Monitor connection pool usage
- Check for slow queries

**4. API Health Check**:
```bash
# Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
# Endpoint: https://your-backend.onrender.com/api/diagnostic/health
# Interval: 5 minutes
# Alert if down for > 2 minutes
```

### Deployment Checklist for Render

- [ ] **Backend**: All environment variables set in Render Dashboard
- [ ] **Frontend**: All `VITE_*` variables set in Render Dashboard
- [ ] **Backend**: `SUPABASE_SERVICE_KEY` is service role key (not anon)
- [ ] **Frontend**: `VITE_API_URL` points to backend URL
- [ ] **CORS**: `ALLOWED_ORIGINS` includes frontend URL
- [ ] **Verification**: Run `verifyDeployment.js` script
- [ ] **Test**: `/api/diagnostic/test-db` returns success
- [ ] **Test**: Frontend loads and displays data
- [ ] **Test**: Realtime updates work (new whales appear)
- [ ] **Monitor**: Set up uptime monitoring for backend

---

## Production Configuration Details

### CORS Whitelist Update

**CRITICAL**: Before deploying, update the CORS configuration in [backend/src/server.js:20-50](backend/src/server.js#L20-L50):

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          'https://your-actual-domain.com',        // Update this
          'https://www.your-actual-domain.com',    // Update this
          'https://your-backend.onrender.com'      // Update this
        ].filter(Boolean)
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173'
        ]

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS policy: Origin ${origin} is not allowed`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
  optionsSuccessStatus: 200
}
```

### Rate Limiting Configuration

Three-tier rate limiting is configured:

1. **Public API** (100 requests / 15 minutes)
   - Applied to: `/api/crypto-trends`, `/api/lunarcrush/*`, `/api/news/*`

2. **Realtime API** (60 requests / minute)
   - Applied to: `/api/whale-alerts`, `/api/market-sentiment`

3. **Health Check** (10 requests / minute)
   - Applied to: `/api/health`

### Environment Variable References

All frontend components use the environment variable pattern:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
```

Files using this pattern:
- [frontend/src/hooks/useLunarCrush.js:4](frontend/src/hooks/useLunarCrush.js#L4)
- [frontend/src/hooks/useCryptoTrends.js:5](frontend/src/hooks/useCryptoTrends.js#L5)
- [frontend/src/pages/admin/DashboardPage.jsx:6](frontend/src/pages/admin/DashboardPage.jsx#L6)
- [frontend/src/pages/admin/UsersPage.jsx:6](frontend/src/pages/admin/UsersPage.jsx#L6)
- [frontend/src/pages/admin/LogsPage.jsx:6](frontend/src/pages/admin/LogsPage.jsx#L6)
- [frontend/src/pages/admin/ServicesPage.jsx:6](frontend/src/pages/admin/ServicesPage.jsx#L6)

---

## Performance Metrics

### Build Analysis (Gzipped)

**Initial Load** (~212 KB):
- Main bundle: 34.51 KB
- vendor-react: 60.23 KB
- vendor-supabase: 45.75 KB
- vendor-charts: 48.84 KB
- vendor-utils: 14.69 KB
- CSS: 8.07 KB

**Lazy-Loaded** (~51 KB):
- Admin pages: 7.58 KB
- Trading page: 31.64 KB
- Other pages: 11.81 KB

**Total Reduction**: 15% from original bundle (250 KB → 212 KB)

---

## Monitoring & Maintenance

### Health Check Endpoint

```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 123456,
  "timestamp": "2025-11-24T00:00:00.000Z"
}
```

### Admin Endpoints

All admin endpoints require `x-admin-token` header:

```bash
curl -H "x-admin-token: your-admin-token-here" \
     https://your-backend-domain.com/api/admin/system/metrics
```

Available admin endpoints:
- `/api/admin/system/metrics` - System metrics (CPU, memory, uptime)
- `/api/admin/system/api-usage` - API usage statistics
- `/api/admin/system/database` - Database statistics
- `/api/admin/system/services` - Service status
- `/api/admin/users` - User management
- `/api/admin/logs/audit` - Audit logs
- `/api/admin/logs/errors` - Error logs

### Log Monitoring

Backend logs are output to stdout. Monitor for:
- `❌` - Error indicators
- `⚠️` - Warning indicators (rate limit, invalid tokens)
- `✅` - Success indicators
- `🐋` - Whale alert activity
- `📊` - Metrics activity

---

## Troubleshooting

### CORS Errors

**Symptom**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Fix**: Update CORS whitelist in [backend/src/server.js:20-50](backend/src/server.js#L20-L50) to include your frontend domain.

### 429 Rate Limit Errors

**Symptom**: `{ "error": "Too many requests from this IP. Please try again in 15 minutes." }`

**Fix**:
- User-facing: This is expected behavior for abuse protection
- Development: Use local backend or wait for cooldown period
- Production: Monitor if legitimate users are hitting limits

### Frontend Environment Variables Not Loading

**Symptom**: Frontend shows "Loading..." forever or API calls fail

**Fix**:
1. Verify `.env.production` exists with `VITE_API_URL` set
2. Rebuild frontend: `npm run build`
3. Vite only injects env vars at build time, not runtime

### Backend Not Starting

**Symptom**: Backend crashes on startup or health check fails

**Fix**:
1. Verify all required env vars are set
2. Check Supabase connection (SUPABASE_URL, SUPABASE_SERVICE_KEY)
3. Verify Whale Alert API key is valid

---

## Security Best Practices

1. **Never commit `.env` files** - Always use `.env.example` templates
2. **Rotate ADMIN_TOKEN periodically** - Generate new token every 90 days
3. **Monitor rate limit logs** - Watch for abuse patterns
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Use HTTPS only** - Never serve production over HTTP

---

## Rollback Procedure

If deployment fails:

1. **Immediate**: Revert to previous Git commit
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Render/Vercel**: Trigger manual deploy of previous working commit

3. **Environment Variables**: Restore from backup or `.env.example`

---

## Support & Resources

- **PRD**: [Docs/PRD.md](Docs/PRD.md)
- **Claude Guide**: [CLAUDE.md](CLAUDE.md)
- **Design System**: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- **Backend API**: `backend/src/server.js`
- **Frontend Entry**: `frontend/src/App.jsx`

---

## Deployment History

| Date | Version | Changes | Status |
|------|---------|---------|--------|
| 2025-11-24 | v1.0 | Initial deployment preparation | ✅ Complete |

---

**Last Reviewed**: 2025-11-24
**Next Review**: Before production deployment
