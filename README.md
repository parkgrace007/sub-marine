# ⚓ SubMarine

Real-time cryptocurrency whale transaction and market sentiment visualization.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Whale Alert API key (https://docs.whale-alert.io/)
- Supabase account (https://supabase.com/)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd real_whale
```

2. Install frontend dependencies
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. Install backend dependencies
```bash
cd ../backend
npm install
cp .env.example .env
# Edit .env with your API keys
```

### Development

**Frontend** (runs on http://localhost:5173)
```bash
cd frontend
npm run dev
```

**Backend** (runs on http://localhost:3000)
```bash
cd backend
npm start
```

## 📚 Documentation

### For AI Developers (Start Here)
1. [CLAUDE.md](CLAUDE.md) - AI Developer Quick Reference
2. [Docs/TASK.md](Docs/TASK.md) - Development Log

### Architecture & Design
3. [Docs/PRD.md](Docs/PRD.md) - Product Requirements (Source of Truth)

### API References
4. [Docs/WHALE_ALERT_API.md](Docs/WHALE_ALERT_API.md) - Whale Alert WebSocket

## 🏗️ Architecture

```
Frontend (React + Vite) ←→ Supabase (PostgreSQL + Realtime)
                                ↑
Backend (Node.js + Express) ────┘
   ├── Whale Alert API (5min intervals)
   └── CoinGecko API (30sec intervals)
```

## 📈 Development Phases

- [x] Phase 0: Project Setup
- [x] Phase 1: Static Background (2-3 hours)
- [x] Phase 2: Whale Physics Engine (4-5 hours)
- [x] Phase 3: Supabase Integration (2-3 hours)
- [x] Phase 4: Whale Alert Integration (3-4 hours)
- [x] Phase 5: SWSI Calculation (3-4 hours)
- [x] Phase 6: Automation & Scheduling (2-3 hours)
- [x] Phase 7: Timeframe Feature (2 hours)
- [x] Phase 8: UX Polish (3-4 hours)
- [ ] Phase 9: Deployment (2 hours)

## 🎯 Core Features

- **Background Layer**: Market sentiment visualization with SWSI indicator (Blue/Red gradient)
- **Whale Layer**: Individual whale transactions with Boids physics simulation
- **Timeframes**: 5min / 15min / 1hour views
- **Real-time Updates**: Supabase Realtime subscriptions
- **Alert Dashboard**: 4-tier trading signals (S/A/B/C) with 12 implemented indicators
- **Multi-Page Routing**: 5 pages (Main, Alerts, Events, News, Guide)

## 🗺️ Navigation

SubMarine is a multi-page application with 5 routes:

| Route | Page | Status | Description |
|-------|------|--------|-------------|
| `/` | MainPage | ✅ Complete | Whale visualization + Alert dashboard |
| `/whale-alerts` | WhaleAlertsPage | 🚧 TODO | Custom alert rule configuration |
| `/events` | EventsPage | 🚧 TODO | Community events & benefits |
| `/news` | NewsPage | 🚧 TODO | Market news & reports |
| `/guide` | GuidePage | 🚧 TODO | User guide & documentation |

**Navigation**: All pages accessible via Header navigation bar

## 🔧 Tech Stack

**Frontend:**
- React 18 + Vite 5
- TailwindCSS 3
- HTML5 Canvas
- Supabase Client

**Backend:**
- Node.js + Express
- node-cron
- Supabase Client (Service Role)

**Database & APIs:**
- Supabase (PostgreSQL + Realtime)
- Whale Alert API
- CoinGecko API

## 🔑 Environment Variables

See `.env.example` files in `frontend/` and `backend/` directories.

### Frontend
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Backend
- `WHALE_ALERT_API_KEY`: Whale Alert API key
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `PORT`: Server port (default: 3000)

## 📝 License

MIT

## 👥 Contributing

See [Docs/PRD.md](Docs/PRD.md) for detailed development guidelines.

## 🔗 Useful Links

- [Whale Alert API Docs](https://docs.whale-alert.io/)
- [Supabase Docs](https://supabase.com/docs)
- [CoinGecko API Docs](https://www.coingecko.com/en/api)
- [Boids Algorithm](https://en.wikipedia.org/wiki/Boids)
