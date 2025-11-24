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
