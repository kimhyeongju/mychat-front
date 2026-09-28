import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // /me 응답 전에는 판단을 미룬다. 이게 없으면 새로고침 시 로그인 페이지로 튕긴다.
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return children;
}
