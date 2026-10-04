import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getDirectMessages,
  getOpenMessages,
  getOpenRoom,
  markDirectRead,
} from '../api/chat';
import MessageInput from '../components/MessageInput';
import MessageList from '../components/MessageList';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

export default function ChatRoomPage({ mode }) {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { connected, subscribe, publish, directRooms, refreshDirectRooms } =
    useChat();

  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef(null);
  // 사용자가 위로 스크롤해 과거를 보는 중이면 자동 스크롤을 하지 않는다.
  const stickToBottomRef = useRef(true);

  const isDirect = mode === 'direct';

  // ----- 방 제목 -----
  useEffect(() => {
    if (isDirect) {
      const room = directRooms.find((r) => r.roomId === roomId);
      setTitle(room?.partnerNickname ?? '대화');
    } else {
      getOpenRoom(roomId)
        .then((room) => setTitle(room.name))
        .catch((err) => setError(err.message));
    }
  }, [isDirect, roomId, directRooms]);

  // ----- 최초 메시지 로드 -----
  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setLoading(true);
    stickToBottomRef.current = true;

    const load = isDirect ? getDirectMessages : getOpenMessages;

    load(roomId)
      .then((page) => {
        setMessages(page.content);
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    if (isDirect) {
      // 방에 들어온 시점에 읽음 처리하고 사이드바 배지를 갱신한다.
      markDirectRead(roomId)
        .then(refreshDirectRooms)
        .catch(() => {});
    }
  }, [isDirect, roomId, refreshDirectRooms]);

  // ----- 실시간 구독 -----
  useEffect(() => {
    if (!connected) return undefined;

    const destination = isDirect
      ? `/user/queue/dm/${roomId}`
      : `/topic/rooms/${roomId}`;

    return subscribe(destination, (message) => {
      setMessages((prev) => {
        // 재연결 등으로 같은 메시지가 두 번 올 수 있다.
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      if (isDirect) {
        markDirectRead(roomId)
          .then(refreshDirectRooms)
          .catch(() => {});
      }
    });
  }, [connected, isDirect, roomId, subscribe, refreshDirectRooms]);

  // ----- 새 메시지 도착 시 아래로 스크롤 -----
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  }, []);

  // ----- 위로 스크롤해 과거 불러오기 -----
  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor) return;

    const el = scrollRef.current;
    const previousHeight = el?.scrollHeight ?? 0;

    const load = isDirect ? getDirectMessages : getOpenMessages;
    const page = await load(roomId, cursor);

    setMessages((prev) => [...page.content, ...prev]);
    setCursor(page.nextCursor);
    setHasMore(page.hasMore);

    // 과거 메시지가 위에 추가되면서 스크롤 위치가 밀리지 않도록 보정한다.
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - previousHeight;
    });
  }, [cursor, hasMore, isDirect, roomId]);

  const handleSend = useCallback(
    (content) => {
      const destination = isDirect
        ? `/app/chat/dm/${roomId}/send`
        : `/app/chat/rooms/${roomId}/send`;

      publish(destination, { content });
      stickToBottomRef.current = true;
    },
    [isDirect, publish, roomId],
  );

  return (
    <div className='chat-room'>
      <header className='chat-room__header'>
        <h1 className='chat-room__title'>{title}</h1>
        {!isDirect && <span className='tag'>오픈</span>}
      </header>

      <div className='chat-room__body' ref={scrollRef} onScroll={handleScroll}>
        {hasMore && (
          <button type='button' className='chat-room__more' onClick={loadMore}>
            이전 메시지 불러오기
          </button>
        )}

        {loading && <p className='muted'>불러오는 중...</p>}
        {error && <p className='form-msg form-msg--error'>{error}</p>}
        {!loading && messages.length === 0 && (
          <p className='muted empty'>첫 메시지를 남겨보세요.</p>
        )}

        <MessageList messages={messages} myId={user?.id} />
      </div>

      <MessageInput
        onSend={handleSend}
        disabled={!connected}
        placeholder={connected ? '메시지를 입력하세요' : '연결 중...'}
      />
    </div>
  );
}
