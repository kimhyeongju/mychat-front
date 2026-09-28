import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getMe } from '../api/auth';
import { getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 최초 진입 시 토큰이 있으면 /me 응답이 올 때까지 인증 여부를 확정할 수 없다.
  const [loading, setLoading] = useState(Boolean(getAccessToken()));

  const fetchUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await getMe());
    } catch {
      // 토큰이 만료됐거나 유효하지 않은 경우
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    // 다른 탭에서 로그인/로그아웃했을 때도 상태를 맞춘다.
    const onStorage = () => fetchUser();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [fetchUser]);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    markLoggedIn: fetchUser,
    markLoggedOut: () => setUser(null),
    refreshUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
}
