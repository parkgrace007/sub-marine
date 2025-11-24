import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { useTradingStore } from '../store/tradingStore'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error)
        setLoading(false) // 에러 발생 시에도 loading 해제
      })

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    // 안전장치: 5초 후에도 loading이 true면 강제로 false 설정
    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to false')
      setLoading(false)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,  // Explicit localhost URL
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

      // 2. 🆕 TradingStore localStorage 완전 삭제
      console.log('🧹 Clearing trading store...')
      localStorage.removeItem('trading-storage-v2')

      // 🆕 TradingStore 초기 상태로 리셋
      useTradingStore.setState({
        balance: 0, // 🔧 FIX: Reset to 0 for logged-out state (not 10000)
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

  const updateNickname = async (newNickname) => {
    if (!user) return { error: 'Not authenticated' }

    const { data, error} = await supabase
      .from('profiles')
      .update({ nickname: newNickname, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (!error) setProfile(data)
    return { data, error }
  }

  const updateTradingBalance = async (newBalance, stats = {}) => {
    if (!user) return { error: 'Not authenticated' }

    const updateData = {
      trading_balance: newBalance,
      updated_at: new Date().toISOString(),
      ...stats // total_trades, winning_trades, total_pnl, all_time_high_balance, max_drawdown, last_trade_at 등
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (!error) {
      setProfile(data)
    }
    return { data, error }
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
