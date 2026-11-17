import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { addWatch, getWatchlist, removeWatch } from '../api/invest';
import { useAuth } from './AuthContext';
import { useI18n } from './LanguageContext';

const WatchlistContext = createContext(null);

/**
 * 내 관심 종목. 투자 화면 어디서든 ★ 버튼이 같은 상태를 보도록 한곳에서 들고 있다.
 * 비로그인이면 목록은 비어 있고, ★ 를 누르면 로그인으로 보낸다.
 */
export function WatchlistProvider({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    if (!isAuthenticated) {
      setItems([]);
      setLoaded(true);
      return Promise.resolve();
    }
    return getWatchlist()
      .then((list) => {
        setItems(list);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading) reload();
  }, [loading, reload]);

  const isWatched = useCallback(
    (symbol) => items.some((i) => i.symbol === symbol),
    [items],
  );

  const toggle = useCallback(
    async (symbol, name) => {
      if (!isAuthenticated) {
        window.alert(t('inv.loginForWatchlist'));
        navigate('/login');
        return;
      }
      const watched = items.some((i) => i.symbol === symbol);
      // 먼저 화면에 반영하고, 서버가 거절하면 되돌린다.
      setItems((prev) =>
        watched
          ? prev.filter((i) => i.symbol !== symbol)
          : [{ symbol, name: name ?? symbol, price: null, stale: true }, ...prev],
      );
      try {
        await (watched ? removeWatch(symbol) : addWatch(symbol));
        reload();
      } catch (err) {
        window.alert(err.message);
        reload();
      }
    },
    [isAuthenticated, items, navigate, reload, t],
  );

  const value = useMemo(
    () => ({ items, loaded, isWatched, toggle, reload }),
    [items, loaded, isWatched, toggle, reload],
  );

  return (
    <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error('useWatchlist 는 WatchlistProvider 안에서만 쓸 수 있습니다.');
  }
  return ctx;
}
