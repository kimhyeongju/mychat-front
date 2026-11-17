import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { startDirect } from '../api/chat';
import { getProfile } from '../api/invest';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import { formatRate, signClass } from '../utils/money';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { t } = useI18n();
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
            {t('inv.backHome')}
          </Link>
          <h1 className='page__title'>
            {data
              ? t('pr.title', {
                  name: withdrawn ? t('inv.withdrawnUser') : data.nickname,
                })
              : t('pr.titleDefault')}
          </h1>
        </div>
        <div className='profile__actions'>
          {data && !withdrawn && isAuthenticated && !isMe && (
            <button type='button' className='btn btn-sm' onClick={sendDm}>
              {t('inv.menuDm')}
            </button>
          )}
          {data && !withdrawn && (isAuthenticated || isMe) && (
            <Link
              to={isMe ? '/invest/portfolio' : `/invest/users/${userId}`}
              className='btn btn-ghost btn-sm'
            >
              {isMe ? t('inv.menuMyPortfolio') : t('up.titleDefault')}
            </Link>
          )}
        </div>
      </div>

      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {!data && !error && <p className='muted'>{t('inv.loading')}</p>}

      {data && (
        <>
          <section className='invest-card'>
            <dl className='invest-stats'>
              <div>
                <dt>{t('pr.totalPoints')}</dt>
                <dd>{t('inv.pointsPlain', { n: data.totalPoints })}</dd>
              </div>
              <div>
                <dt>{t('pr.leaderboardRank')}</dt>
                <dd>
                  {data.leaderboardRank != null
                    ? t('inv.rankN', { n: data.leaderboardRank })
                    : '-'}
                </dd>
              </div>
              <div>
                <dt>{t('pr.first')}</dt>
                <dd>{t('inv.timesN', { n: data.firstPlaces })}</dd>
              </div>
              <div>
                <dt>{t('pr.second')}</dt>
                <dd>{t('inv.timesN', { n: data.secondPlaces })}</dd>
              </div>
              <div>
                <dt>{t('pr.third')}</dt>
                <dd>{t('inv.timesN', { n: data.thirdPlaces })}</dd>
              </div>
              <div>
                <dt>{t('pr.weeksPlayed')}</dt>
                <dd>{t('inv.weeksN', { n: data.weeksPlayed })}</dd>
              </div>
            </dl>
          </section>

          <section className='invest-card'>
            <h2 className='invest-card__title'>{t('pr.recent')}</h2>
            {data.recent.length === 0 ? (
              <p className='muted empty'>{t('pr.noWeeks')}</p>
            ) : (
              <table className='invest-table'>
                <thead>
                  <tr>
                    <th>{t('pr.colDate')}</th>
                    <th className='num'>{t('pr.colRank')}</th>
                    <th className='num'>{t('inv.returnRate')}</th>
                    <th className='num'>{t('inv.colPoints')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((w) => (
                    <tr key={w.weekEndDate}>
                      <td>{w.weekEndDate}</td>
                      <td className='num'>{t('inv.rankN', { n: w.rank })}</td>
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
