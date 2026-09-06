import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getMessages, joinRoom } from '../api/chat';
import ThemeToggle from '../components/ThemeToggle';
import { useChatSocket } from '../hooks/useChatSocket';
import '../styles/chat.css';
import { formatClockTime } from '../utils/time';

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [identity, setIdentity] = useState(location.state ?? null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const listRef = useRef(null);

  // 새로고침 등으로 memberId가 없으면(state 유실) 다시 입장 처리
  useEffect(() => {
    if (identity) return;
    joinRoom(roomId)
      .then((res) => setIdentity(res))
      .catch((err) => setError(err.message));
  }, [identity, roomId]);

  const loadPage = useCallback(
    (pageNumber) => {
      getMessages(roomId, { page: pageNumber })
        .then((res) => {
          const ordered = [...res.content].reverse(); // 서버는 최신순 → 화면은 오래된 순
          setMessages((prev) =>
            pageNumber === 0 ? ordered : [...ordered, ...prev],
          );
          setHasMore(!res.last);
          setPage(pageNumber);
        })
        .catch((err) => setError(err.message));
    },
    [roomId],
  );

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  useEffect(() => {
    if (page === 0) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }
  }, [messages, page]);

  const handleIncoming = useCallback((message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.messageId === message.messageId)) return prev;
      return [...prev, message];
    });
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, []);

  const { connected, sendMessage } = useChatSocket(roomId, handleIncoming);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !identity) return;
    sendMessage(identity.memberId, input.trim());
    setInput('');
  };

  return (
    <div className='chat-shell room-page'>
      <div className='room-topbar'>
        <button className='btn-ghost' onClick={() => navigate('/chat/nearby')}>
          ← 나가기
        </button>
        <span className='room-topbar-title'>
          {identity ? `${identity.nickname}(으)로 참여 중` : '입장하는 중...'}
        </span>
        <span
          className={`connection-dot ${connected ? 'connected' : ''}`}
          title={connected ? '연결됨' : '연결 끊김'}
        />
        <ThemeToggle floating={false} />
      </div>

      {error && (
        <div className='banner banner-error' style={{ margin: 12 }}>
          {error}
        </div>
      )}

      <div className='message-list' ref={listRef}>
        {hasMore && (
          <button
            className='btn btn-secondary load-more'
            onClick={() => loadPage(page + 1)}
          >
            이전 메시지 더보기
          </button>
        )}

        {messages.map((msg) => {
          const own = identity && msg.senderMemberId === identity.memberId;
          return (
            <div
              key={msg.messageId}
              className={`message-row ${own ? 'own' : ''}`}
            >
              {!own && (
                <div className='message-nickname'>{msg.senderNickname}</div>
              )}
              <div className='message-bubble-wrap'>
                <div className='message-bubble'>{msg.content}</div>
                <span className='message-time'>
                  {formatClockTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <form className='room-input-bar' onSubmit={handleSend}>
        <input
          className='text-input'
          placeholder={identity ? '메시지를 입력하세요' : '입장 중...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!identity}
        />
        <button
          type='submit'
          className='btn btn-primary'
          disabled={!identity || !input.trim()}
        >
          전송
        </button>
      </form>
    </div>
  );
}
