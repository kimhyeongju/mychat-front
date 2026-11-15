import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { startDirect } from '../api/chat';
import { getProfile } from '../api/invest';
import { useAuth } from '../context/AuthContext';
import { formatRate, signClass } from '../utils/money';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    getProfile(userId)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [userId]);

  const isMe = userId === user?.id;
  const withdrawn = data?.nickname === '(탈퇴한 사용자)';

  const sendDm = async () => {
    try {
      const room = await startDirect(userId);
      navigate(`/chat/dm/${room.roomId}`);
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <main className='page page--wide invest'>
      <div className='page__header'>
        <div className='invest__title-row'>
          <Link to='/invest' className='btn btn-ghost btn-sm'>
            ← 투자 홈
          </Link>
          <h1 className='page__title'>
            {data ? `${data.nickname}님의 프로필` : '프로필'}
          </h1>
        </div>
        <div className='profile__actions'>
          {data && !withdrawn && isAuthenticated && !isMe && (
            <button type='button' className='btn btn-sm' onClick={sendDm}>
              DM 보내기
            </button>
          )}
          {data && !withdrawn && (isAuthenticated || isMe) && (
            <Link
              to={isMe ? '/invest/portfolio' : `/invest/users/${userId}`}
              className='btn btn-ghost btn-sm'
            >
              {isMe ? '내 포트폴리오' : '포트폴리오'}
            </Link>
          )}
        </div>
      </div>

      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {!data && !error && <p className='muted'>불러오는 중...</p>}

      {data && (
        <>
          <section className='invest-card'>
            <dl className='invest-stats'>
              <div>
                <dt>누적 포인트</dt>
                <dd>{data.totalPoints}점</dd>
              </div>
              <div>
                <dt>리더보드 순위</dt>
                <dd>
                  {data.leaderboardRank != null
                    ? `${data.leaderboardRank}위`
                    : '-'}
                </dd>
              </div>
              <div>
                <dt>🥇 1위</dt>
                <dd>{data.firstPlaces}회</dd>
              </div>
              <div>
                <dt>🥈 2위</dt>
                <dd>{data.secondPlaces}회</dd>
              </div>
              <div>
                <dt>🥉 3위</dt>
                <dd>{data.thirdPlaces}회</dd>
              </div>
              <div>
                <dt>참여한 주</dt>
                <dd>{data.weeksPlayed}주</dd>
              </div>
            </dl>
          </section>

          <section className='invest-card'>
            <h2 className='invest-card__title'>최근 주간 성적</h2>
            {data.recent.length === 0 ? (
              <p className='muted empty'>아직 정산된 주간 성적이 없습니다.</p>
            ) : (
              <table className='invest-table'>
                <thead>
                  <tr>
                    <th>마감일</th>
                    <th className='num'>순위</th>
                    <th className='num'>수익률</th>
                    <th className='num'>포인트</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((w) => (
                    <tr key={w.weekEndDate}>
                      <td>{w.weekEndDate}</td>
                      <td className='num'>{w.rank}위</td>
                      <td className={`num ${signClass(w.returnRate)}`}>
                        {formatRate(w.returnRate)}
                      </td>
                      <td className='num'>{w.points > 0 ? `+${w.points}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  );
}
