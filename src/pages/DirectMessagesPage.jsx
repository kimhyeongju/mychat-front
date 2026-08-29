import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrCreateDirectRoom, joinRoom, listDirectRooms } from '../api/chat';
import { searchUsers } from '../api/user';
import '../styles/chat.css';
import { timeAgo } from '../utils/time';

export default function DirectMessagesPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listDirectRooms()
      .then(setRooms)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingRooms(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSearching(true);
    setError('');
    searchUsers(keyword.trim())
      .then(setSearchResults)
      .catch((err) => setError(err.message))
      .finally(() => setSearching(false));
  };

  const enterRoom = (joinPromise) => {
    setError('');
    joinPromise
      .then((res) => {
        navigate(`/chat/rooms/${res.roomId}`, {
          state: { memberId: res.memberId, nickname: res.nickname },
        });
      })
      .catch((err) => setError(err.message));
  };

  return (
    <div className='chat-shell'>
      <div className='nearby-page'>
        <div className='nearby-header'>
          <h1>대화 상대</h1>
          <Link to='/' className='btn-ghost'>
            홈으로
          </Link>
        </div>

        {error && (
          <div className='banner banner-error' style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <form
          className='verify-row'
          onSubmit={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <input
            className='text-input'
            placeholder='닉네임으로 검색'
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button
            type='submit'
            className='btn btn-secondary'
            disabled={searching}
          >
            {searching ? '검색 중...' : '검색'}
          </button>
        </form>

        {searchResults && (
          <>
            <div className='field-hint' style={{ marginBottom: 8 }}>
              검색 결과
            </div>
            <div className='room-list'>
              {searchResults.length === 0 && (
                <div className='empty-state'>일치하는 사용자가 없어요.</div>
              )}
              {searchResults.map((user) => (
                <button
                  key={user.userId}
                  className='room-card'
                  onClick={() => enterRoom(getOrCreateDirectRoom(user.userId))}
                >
                  <div className='room-card-title'>{user.nickname}</div>
                  <span className='room-card-badge'>대화 시작</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className='field-hint' style={{ marginBottom: 8, marginTop: 8 }}>
          대화 중인 상대
        </div>
        <div className='room-list'>
          {loadingRooms && <div className='empty-state'>불러오는 중...</div>}
          {!loadingRooms && rooms.length === 0 && (
            <div className='empty-state'>
              아직 나눈 대화가 없어요. 위에서 상대를 검색해보세요.
            </div>
          )}
          {!loadingRooms &&
            rooms.map((room) => (
              <button
                key={room.roomId}
                className='room-card'
                onClick={() => enterRoom(joinRoom(room.roomId))}
              >
                <div>
                  <div className='room-card-title'>{room.partnerNickname}</div>
                  <div className='room-card-meta'>방 #{room.roomId}</div>
                </div>
                {room.lastActivityAt && (
                  <span className='room-card-badge'>
                    {timeAgo(room.lastActivityAt)}
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
