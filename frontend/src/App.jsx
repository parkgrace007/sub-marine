import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WhaleDataProvider } from './contexts/WhaleDataContext'
import VisitorTracker from './components/VisitorTracker'

// Critical pages - loaded immediately
import MainPage from './pages/MainPage'
import WhaleAlertsPage from './pages/WhaleAlertsPage'

// Non-critical pages - lazy loaded
const TradingPage = lazy(() => import('./pages/TradingPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))
const GuidePage = lazy(() => import('./pages/GuidePage'))

// Admin Pages - lazy loaded (not accessed by most users)
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const LogsPage = lazy(() => import('./pages/admin/LogsPage'))
const ServicesPage = lazy(() => import('./pages/admin/ServicesPage'))

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen bg-surface-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-surface-400">Loading...</p>
    </div>
  </div>
)

/**
 * App - Root component with routing
 * Routes:
 * - / - Main whale visualization dashboard
 * - /whale-alerts - Whale alerts and notifications
 * - /trading - Trading dashboard
 * - /events - Events and benefits
 * - /news - News and reports
 * - /guide - User guide and documentation
 * - /admin/* - Admin panel routes
 */
function App() {
  return (
    <AuthProvider>
      <WhaleDataProvider>
        <BrowserRouter>
          {/* 방문자 추적 (BrowserRouter 내부, Routes 외부) */}
          <VisitorTracker />
          <Suspense fallback={<LoadingFallback />}>
          {/* Page Routes */}
          <Routes>
            {/* Main App Routes - critical pages loaded immediately */}
            <Route path="/" element={<MainPage />} />
            <Route path="/whale-alerts" element={<WhaleAlertsPage />} />

            {/* Non-critical pages - lazy loaded */}
            <Route path="/trading" element={<TradingPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/guide" element={<GuidePage />} />

            {/* Admin Routes - lazy loaded */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/logs" element={<LogsPage />} />
            <Route path="/admin/services" element={<ServicesPage />} />

            {/* 404 Not Found */}
            <Route path="*" element={
              <div className="min-h-screen bg-surface-100 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-surface-400 mb-4">404</h1>
                  <p className="text-surface-500 text-xl mb-8">페이지를 찾을 수 없습니다</p>
                  <Link to="/" className="text-primary hover:underline text-lg font-medium">
                    홈으로 돌아가기
                  </Link>
                </div>
              </div>
            } />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </WhaleDataProvider>
    </AuthProvider>
  )
}

export default App
