import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { hideDirectRoom, startDirect } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import '../styles/chat.css';
import UserSearchModal from './UserSearchModal';

export default function ChatLayout() {
  const { isAuthenticated } = useAuth();
  const { openRooms, directRooms, refreshDirectRooms, connected } = useChat();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelectUser = async (user) => {
    if (!user?.userId) {
      window.alert('사용자 정보를 읽을 수 없습니다.');
      return;
    }
    setSearchOpen(false);
    try {
      const room = await startDirect(user.userId);
      await refreshDirectRooms();
      navigate(`/chat/dm/${room.roomId}`);
    } catch (err) {
      window.alert(err.message);
    }
  };

  const closeSidebar = () => setSidebarOpen(false);
  const location = useLocation();

  const handleHideRoom = async (e, roomId) => {
    // NavLink 클릭으로 이어지지 않게 막는다.
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        '이 대화를 목록에서 삭제할까요?\n상대가 다시 메시지를 보내면 나타납니다.',
      )
    ) {
      return;
    }

    try {
      await hideDirectRoom(roomId);
      await refreshDirectRooms();

      // 지금 보고 있던 방을 삭제했으면 빈 화면으로 보낸다.
      if (location.pathname === `/chat/dm/${roomId}`) {
        navigate('/chat');
      }
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className='chat'>
      {/* 모바일에서 사이드바를 여는 버튼 */}
      <button
        type='button'
        className='chat__sidebar-toggle'
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label='대화 목록'
      >
        ☰
      </button>

      <aside
        className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar--open' : ''}`}
      >
        <div className='chat-sidebar__status'>
          <span
            className={`dot ${connected ? 'dot--connected' : 'dot--disconnected'}`}
          />
          {connected ? '연결됨' : '연결 중...'}
        </div>

        <section className='chat-sidebar__section'>
          <h2 className='chat-sidebar__title'>오픈 채팅</h2>
          <ul className='chat-sidebar__list'>
            {openRooms.map((room) => (
              <li key={room.id}>
                <NavLink
                  to={`/chat/open/${room.id}`}
                  className={({ isActive }) =>
                    `chat-sidebar__item ${isActive ? 'chat-sidebar__item--active' : ''}`
                  }
                  onClick={closeSidebar}
                >
                  <span className='chat-sidebar__name'>{room.name}</span>
                  {room.description && (
                    <span className='chat-sidebar__desc'>
                      {room.description}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>

        <section className='chat-sidebar__section'>
          <div className='chat-sidebar__header'>
            <h2 className='chat-sidebar__title'>다이렉트 메시지</h2>
            {isAuthenticated && (
              <button
                type='button'
                className='chat-sidebar__add'
                onClick={() => setSearchOpen(true)}
                aria-label='새 대화 시작'
              >
                +
              </button>
            )}
          </div>

          {!isAuthenticated && (
            <p className='chat-sidebar__empty'>
              로그인하면 DM을 사용할 수 있어요.
            </p>
          )}

          {isAuthenticated && directRooms.length === 0 && (
            <p className='chat-sidebar__empty'>아직 대화가 없습니다.</p>
          )}

          <ul className='chat-sidebar__list'>
            {directRooms.map((room) => (
              <li key={room.roomId}>
                <NavLink
                  to={`/chat/dm/${room.roomId}`}
                  className={({ isActive }) =>
                    `chat-sidebar__item ${isActive ? 'chat-sidebar__item--active' : ''}`
                  }
                  onClick={closeSidebar}
                >
                  <span className='chat-sidebar__row'>
                    <span className='chat-sidebar__name'>
                      {room.partnerNickname}
                    </span>
                    <span className='chat-sidebar__actions'>
                      {room.unreadCount > 0 && (
                        <span className='chat-sidebar__badge'>
                          {room.unreadCount > 99 ? '99+' : room.unreadCount}
                        </span>
                      )}
                      <button
                        type='button'
                        className='chat-sidebar__hide'
                        onClick={(e) => handleHideRoom(e, room.roomId)}
                        aria-label='대화 삭제'
                      >
                        ×
                      </button>
                    </span>
                  </span>
                  {room.lastMessagePreview && (
                    <span className='chat-sidebar__desc'>
                      {room.lastMessagePreview}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      {/* 모바일에서 사이드바 바깥을 눌러 닫기 */}
      {sidebarOpen && (
        <div
          className='chat__overlay'
          onClick={closeSidebar}
          aria-hidden='true'
        />
      )}

      <section className='chat-main'>
        <Outlet />
      </section>

      {searchOpen && (
        <UserSearchModal
          onSelect={handleSelectUser}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
