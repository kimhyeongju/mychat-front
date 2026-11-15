import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * 운영자만 들어올 수 있는 화면. 화면 가림은 편의일 뿐이고,
 * 실제 권한 확인은 서버(/api/admin/**)가 한다.
 */
export default function RequireAdmin({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }
  if (!user?.admin) {
    return <Navigate to='/' replace />;
  }
  return children;
}
