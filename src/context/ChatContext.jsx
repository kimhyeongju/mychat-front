import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  ensureAnonymousSession,
  getDirectRooms,
  getOpenRooms,
} from '../api/chat';
import { useChatSocket } from '../hooks/useChatSocket';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [openRooms, setOpenRooms] = useState([]);
  const [directRooms, setDirectRooms] = useState([]);
  const [ready, setReady] = useState(false);

  // 비로그인도 오픈 채팅에 참여하므로 익명 세션을 먼저 확보한다.
  useEffect(() => {
    if (authLoading) return;

    ensureAnonymousSession()
      .catch(() => {})
      .finally(() => setReady(true));
  }, [authLoading]);

  const socket = useChatSocket({ enabled: ready });

  const refreshOpenRooms = useCallback(() => {
    getOpenRooms()
      .then(setOpenRooms)
      .catch(() => {});
  }, []);

  const refreshDirectRooms = useCallback(() => {
    if (!isAuthenticated) {
      setDirectRooms([]);
      return;
    }
    getDirectRooms()
      .then(setDirectRooms)
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    refreshOpenRooms();
  }, [refreshOpenRooms]);

  useEffect(() => {
    refreshDirectRooms();
  }, [refreshDirectRooms]);

  const value = {
    openRooms,
    directRooms,
    refreshOpenRooms,
    refreshDirectRooms,
    ...socket,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx)
    throw new Error('useChat은 ChatProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
}
