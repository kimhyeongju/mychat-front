import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLocationRoom, findNearbyRooms, joinRoom } from '../api/chat';
import { useGeolocation } from '../hooks/useGeolocation';
import '../styles/chat.css';
import { timeAgo } from '../utils/time';

const RADIUS_OPTIONS = [
  { label: '100m', value: 100 },
  { label: '1km', value: 1000 },
];

export default function NearbyRoomsPage() {
  const navigate = useNavigate();
  const { position, status, error: geoError, refresh } = useGeolocation();

  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [actionError, setActionError] = useState('');
  const [creating, setCreating] = useState(false);

  // 페이지 진입 즉시 브라우저 권한 팝업을 띄우지 않고,
  // 사용자가 프라이밍 화면에서 "위치 허용하기"를 눌렀을 때만 refresh()를 호출한다.
  useEffect(() => {
    if (status !== 'ready' || !position) return;

    setLoadingRooms(true);
    findNearbyRooms(position.latitude, position.longitude)
      .then(setRooms)
      .catch((err) => setActionError(err.message))
      .finally(() => setLoadingRooms(false));
  }, [status, position]);

  const enterRoom = (roomId, joinPromise) => {
    setActionError('');
    joinPromise
      .then((res) => {
        navigate(`/chat/rooms/${roomId ?? res.roomId}`, {
          state: { memberId: res.memberId, nickname: res.nickname },
        });
      })
      .catch((err) => setActionError(err.message));
  };

  const handleJoinExisting = (roomId) => {
    enterRoom(roomId, joinRoom(roomId));
  };

  const handleCreateRoom = () => {
    if (!position) return;
    setCreating(true);
    enterRoom(
      null,
      createLocationRoom({
        latitude: position.latitude,
        longitude: position.longitude,
        radiusMeters,
      }).finally(() => setCreating(false)),
    );
  };

  return (
    <div className='chat-shell'>
      <div className='nearby-page'>
        <div className='nearby-header'>
          <h1>내 주변 채팅</h1>
        </div>

        {status === 'idle' && (
          <div className='location-primer'>
            <div className='location-primer-icon' aria-hidden='true'>
              <span />
              <span />
              <span />
            </div>
            <h2 className='auth-title' style={{ fontSize: 19 }}>
              주변 사람과 바로 채팅해요
            </h2>
            <p className='auth-subtitle'>
              내 위치를 기준으로 반경 안에 있는 사람들과 익명으로 대화할 수
              있어요. 위치 정보는 방 검색/생성에만 사용되고 저장되지 않아요.
            </p>
            <button className='btn btn-primary btn-block' onClick={refresh}>
              위치 허용하고 시작하기
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className='banner banner-success'>내 위치를 확인하는 중...</div>
        )}
        {status === 'error' && (
          <div className='banner banner-error'>
            {geoError}
            <div style={{ marginTop: 8 }}>
              <button className='btn btn-secondary' onClick={refresh}>
                다시 시도
              </button>
            </div>
          </div>
        )}
        {actionError && (
          <div className='banner banner-error' style={{ marginBottom: 12 }}>
            {actionError}
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className='room-list'>
              {loadingRooms && (
                <div className='empty-state'>주변 방을 찾는 중...</div>
              )}

              {!loadingRooms && rooms.length === 0 && (
                <div className='empty-state'>
                  주변에 활성화된 방이 없어요. 아래에서 새로 만들어보세요.
                </div>
              )}

              {!loadingRooms &&
                rooms.map((room) => (
                  <button
                    key={room.roomId}
                    className='room-card'
                    onClick={() => handleJoinExisting(room.roomId)}
                  >
                    <div>
                      <div className='room-card-title'>
                        반경 {room.radiusMeters}m 채팅방
                      </div>
                      <div className='room-card-meta'>방 #{room.roomId}</div>
                    </div>
                    <span className='room-card-badge'>
                      {timeAgo(room.lastActivityAt)}
                    </span>
                  </button>
                ))}
            </div>

            <div className='field-hint' style={{ marginBottom: 8 }}>
              새 방 만들기
            </div>
            <div className='radius-select'>
              {RADIUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`radius-chip ${radiusMeters === option.value ? 'active' : ''}`}
                  onClick={() => setRadiusMeters(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              className='btn btn-primary btn-block'
              disabled={creating}
              onClick={handleCreateRoom}
            >
              {creating
                ? '만드는 중...'
                : `반경 ${radiusMeters >= 1000 ? radiusMeters / 1000 + 'km' : radiusMeters + 'm'}로 방 만들기`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
