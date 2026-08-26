import { createContext, useContext, useEffect, useState } from 'react'
import { getAccessToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()))

  useEffect(() => {
    // 다른 탭에서 로그인/로그아웃했을 때도 상태를 맞춘다.
    const onStorage = () => setIsAuthenticated(Boolean(getAccessToken()))
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = {
    isAuthenticated,
    markLoggedIn: () => setIsAuthenticated(true),
    markLoggedOut: () => setIsAuthenticated(false),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
