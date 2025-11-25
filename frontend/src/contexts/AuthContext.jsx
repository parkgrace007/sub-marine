import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { useTradingStore } from '../store/tradingStore'

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Debug: Check URL for OAuth tokens
    const urlHash = window.location.hash
    console.log('🔐 [AuthContext] Initializing...')
    console.log('   URL hash present:', urlHash.length > 0)
    console.log('   API_URL:', API_URL)

    // Manual OAuth token handling (detectSessionUrl sometimes fails)
    const handleOAuthCallback = async () => {
      if (urlHash.includes('access_token')) {
        console.log('   ✅ OAuth tokens detected in URL hash, processing...')

        try {
          // Parse tokens from URL hash
          const params = new URLSearchParams(urlHash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && refreshToken) {
            console.log('   🔄 Setting session from URL tokens...')

            // Decode JWT to get user info (no network call needed)
            const payloadBase64 = accessToken.split('.')[1]
            const payload = JSON.parse(atob(payloadBase64))
            console.log('   📋 JWT payload decoded:', {
              userId: payload.sub?.substring(0, 8),
              email: payload.email
            })

            // Create user object from JWT
            const user = {
              id: payload.sub,
              email: payload.email,
              user_metadata: payload.user_metadata || {},
              app_metadata: payload.app_metadata || {},
              aud: payload.aud,
              role: payload.role
            }

            // Store tokens in localStorage (Supabase format)
            const storageKey = `sb-${new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]}-auth-token`
            const sessionData = {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: payload.exp,
              expires_in: payload.exp - Math.floor(Date.now() / 1000),
              token_type: 'bearer',
              user: user
            }
            localStorage.setItem(storageKey, JSON.stringify(sessionData))
            console.log('   💾 Session stored in localStorage')

            // Clear the URL hash
            window.history.replaceState(null, '', window.location.pathname)
            console.log('   🧹 URL hash cleared')

            // Set user state
            setUser(user)
            console.log('✅ [AuthContext] User set from JWT:', {
              userId: user.id?.substring(0, 8),
              email: user.email
            })

            // Fetch profile
            await fetchProfile(user.id)
            return // Session handled, don't proceed to getSession
          }
        } catch (err) {
          console.error('❌ [AuthContext] OAuth callback error:', err)
        }
      }

      // Fall back to getSession for existing sessions
      console.log('🔐 [AuthContext] Checking existing session...')
      const { data: { session }, error } = await supabase.auth.getSession()

      console.log('🔐 [AuthContext] getSession result:', {
        hasSession: !!session,
        userId: session?.user?.id?.substring(0, 8) || 'none',
        error: error?.message || 'none'
      })

      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        console.log('🔐 [AuthContext] No session found, user is logged out')
        setLoading(false)
      }
    }

    handleOAuthCallback()

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [AuthContext] Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id?.substring(0, 8) || 'none'
        })

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    // 안전장치: 10초 후에도 loading이 true면 강제로 false 설정
    const timeout = setTimeout(() => {
      console.warn('⚠️ [AuthContext] Auth loading timeout - forcing loading to false')
      setLoading(false)
    }, 10000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  // Fetch profile via Backend API (not direct Supabase)
  const fetchProfile = async (userId) => {
    try {
      console.log(`👤 [AuthContext] Fetching profile via Backend API...`)

      const response = await fetch(`${API_URL}/api/profiles/${userId}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch profile')
      }

      // If profile doesn't exist, create one
      if (!json.data) {
        console.log(`👤 [AuthContext] No profile found, creating new profile...`)
        const createResponse = await fetch(`${API_URL}/api/profiles/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: 'User' })
        })

        if (createResponse.ok) {
          const createJson = await createResponse.json()
          if (createJson.success && createJson.data) {
            setProfile(createJson.data)
            console.log(`✅ [AuthContext] Profile created in ${createJson.queryTime}ms`)
          }
        }
      } else {
        setProfile(json.data)
        console.log(`✅ [AuthContext] Profile loaded in ${json.queryTime}ms`)
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,  // Explicit redirect URL
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    if (error) console.error('Error signing in:', error)
  }

  const signOut = async () => {
    try {
      console.log('🚪 Logging out...')

      // 1. Supabase signOut (scope: global로 모든 탭에서 로그아웃)
      await supabase.auth.signOut({ scope: 'global' })

      // 2. TradingStore localStorage 완전 삭제
      console.log('🧹 Clearing trading store...')
      localStorage.removeItem('trading-storage-v2')

      // TradingStore 초기 상태로 리셋
      useTradingStore.setState({
        balance: 0, // Reset to 0 for logged-out state
        positions: [],
        orders: [],
        tradeHistory: []
      })

      // 3. 수동으로 모든 Supabase 관련 저장소 삭제 (PKCE 세션 정리)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          console.log('🧹 Removing storage key:', key)
          localStorage.removeItem(key)
        }
      })
      sessionStorage.clear()

      // 4. React 상태 초기화
      setUser(null)
      setProfile(null)

      console.log('✅ Logout complete, reloading page...')

      // 5. 페이지 완전 리로드 (모든 상태 초기화)
      window.location.href = '/'
    } catch (err) {
      console.error('❌ Logout error:', err)
      // 에러가 나도 강제로 정리하고 리로드
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    }
  }

  // Update nickname via Backend API
  const updateNickname = async (newNickname) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      console.log(`👤 [AuthContext] Updating nickname via Backend API...`)

      const response = await fetch(`${API_URL}/api/profiles/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: newNickname })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to update nickname')
      }

      setProfile(json.data)
      console.log(`✅ [AuthContext] Nickname updated in ${json.queryTime}ms`)

      return { data: json.data, error: null }
    } catch (error) {
      console.error('❌ [AuthContext] Error updating nickname:', error)
      return { data: null, error: error.message }
    }
  }

  // Update trading balance via Backend API
  const updateTradingBalance = async (newBalance, stats = {}) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      console.log(`👤 [AuthContext] Updating trading balance via Backend API...`)

      const updateData = {
        trading_balance: newBalance,
        ...stats // total_trades, winning_trades, total_pnl, all_time_high_balance, max_drawdown, last_trade_at 등
      }

      const response = await fetch(`${API_URL}/api/profiles/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to update trading balance')
      }

      setProfile(json.data)
      console.log(`✅ [AuthContext] Trading balance updated in ${json.queryTime}ms`)

      return { data: json.data, error: null }
    } catch (error) {
      console.error('❌ [AuthContext] Error updating trading balance:', error)
      return { data: null, error: error.message }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signInWithGoogle,
      signOut,
      updateNickname,
      updateTradingBalance
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
