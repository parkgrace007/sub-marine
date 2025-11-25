import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import NicknameModal from './NicknameModal'
import LanguageToggle from './LanguageToggle'

function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, profile, signInWithGoogle, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/whale-alerts', label: t('nav.whaleAlerts') },
    { path: '/trading', label: t('nav.trading') },
    { path: '/news', label: t('nav.news') },
    { path: '/events', label: t('nav.events') },
    { path: '/guide', label: t('nav.guide') }
  ]


  return (
    <header className="sticky top-0 w-full z-50 bg-surface-100 border-b border-surface-300">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-3">
        <div className="grid grid-cols-3 items-center gap-4">

          {/* Left: Logo */}
          <div className="flex items-center justify-start">
            <Link to="/" className="group hover:opacity-80 transition-all duration-300">
              <img src="/logo.png" alt="SubMarine Logo" className="h-6 w-auto object-contain" />
            </Link>
          </div>

          {/* Center: Navigation - Desktop only */}
          <div className="flex items-center justify-center">
            <nav className="hidden md:flex items-center gap-1 bg-surface-200/50 p-1 rounded-md border border-surface-300/50 backdrop-blur-sm">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      relative px-3 py-2 text-sm font-medium transition-all duration-300 whitespace-nowrap
                      ${isActive
                        ? 'text-primary'
                        : 'text-surface-500 hover:text-surface-600'
                      }
                    `}
                  >
                    {link.label}
                    {/* Active Indicator Line */}
                    <span className={`
                      absolute bottom-0 left-0 w-full h-[2px] bg-primary transform transition-transform duration-300
                      ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}
                    `} />
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right: User & Actions - Desktop only */}
          <div className="flex items-center justify-end gap-2">
            {/* Language Toggle */}
            <LanguageToggle className="hidden md:flex" />

            {user ? (
              /* Logged In - User Menu */
              <div className="hidden md:block relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-200 hover:bg-surface-300 border border-surface-300 rounded-md transition-all duration-300"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    {profile?.nickname?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-surface-600">
                    {profile?.nickname || 'User'}
                  </span>
                  <svg className={`w-4 h-4 text-surface-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-100 border border-surface-300 rounded-md shadow-lg z-50">
                    <button
                      onClick={() => {
                        setIsNicknameModalOpen(true)
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-surface-600 hover:bg-surface-200 transition-colors"
                    >
                      {t('header.profile')}
                    </button>
                    <button
                      onClick={async () => {
                        await signOut()
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-surface-600 hover:bg-surface-200 transition-colors border-t border-surface-300"
                    >
                      {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Not Logged In - Login Button */
              <button
                onClick={signInWithGoogle}
                className="
                  hidden md:flex items-center gap-2 px-3 py-1.5
                  bg-surface-200 hover:bg-surface-300 border border-surface-300
                  text-surface-600 font-medium text-sm rounded-md
                  transition-all duration-300 hover:-translate-y-0.5
                "
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{t('header.login')}</span>
              </button>
            )}

            {/* Hamburger Menu Button - Mobile only */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex flex-col gap-1.5 p-2 hover:bg-surface-200 rounded transition-colors"
              aria-label={t('common.close')}
            >
              <span className="w-6 h-0.5 bg-surface-600 rounded-full"></span>
              <span className="w-6 h-0.5 bg-surface-600 rounded-full"></span>
              <span className="w-6 h-0.5 bg-surface-600 rounded-full"></span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide Menu */}
          <div className="fixed right-0 top-0 h-full w-[280px] bg-surface-100 border-l border-surface-300 z-[100] shadow-2xl transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-surface-300">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-surface-600">{t('nav.home')}</h2>
                  <LanguageToggle />
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-surface-500 hover:text-surface-600 text-2xl leading-none p-1"
                  aria-label={t('common.close')}
                >
                  ×
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col p-4 gap-1 flex-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        px-4 py-3 rounded-md text-sm font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-primary/10 text-primary border-l-2 border-primary'
                          : 'text-surface-500 hover:bg-surface-200 hover:text-surface-600'
                        }
                      `}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </nav>

              {/* User Actions */}
              <div className="p-4 border-t border-surface-300">
                {user ? (
                  /* Logged In - User Info & Actions */
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 bg-surface-200 rounded-md">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {profile?.nickname?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-surface-600">{profile?.nickname || 'User'}</p>
                        <p className="text-xs text-surface-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsNicknameModalOpen(true)
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-surface-600 bg-surface-200 hover:bg-surface-300 rounded-md transition-colors"
                    >
                      {t('header.profile')}
                    </button>
                    <button
                      onClick={async () => {
                        await signOut()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-surface-600 bg-surface-200 hover:bg-surface-300 rounded-md transition-colors"
                    >
                      {t('header.logout')}
                    </button>
                  </div>
                ) : (
                  /* Not Logged In - Login Button */
                  <button
                    onClick={() => {
                      signInWithGoogle()
                      setIsMobileMenuOpen(false)
                    }}
                    className="
                      w-full flex items-center justify-center gap-2 px-4 py-3
                      bg-surface-200 hover:bg-surface-300 border border-surface-300
                      text-surface-600 font-medium text-sm rounded-md
                      transition-all duration-300
                    "
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>{t('header.login')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Nickname Modal */}
      <NicknameModal
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
      />
    </header>
  )
}

export default Header
