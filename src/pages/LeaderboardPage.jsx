import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard, getWeekInfo } from '../api/invest';
import RankingNickname from '../components/RankingNickname';
import RulesHelp from '../components/RulesHelp';
import { useI18n } from '../context/LanguageContext';
import usePolling from '../hooks/usePolling';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState(null);
  const [week, setWeek] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    getLeaderboard()
      .then((r) => {
        setRows(r);
        setError('');
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
    getWeekInfo()
      .then(setWeek)
      .catch(() => {});
  }, []);

  usePolling(load, 60_000);

  return (
    <main className='page page--wide invest'>
      <div className='page__header'>
        <div className='invest__title-row'>
          <Link to='/invest' className='btn btn-ghost btn-sm'>
            {t('inv.backHome')}
          </Link>
          <h1 className='page__title'>
            {t('lb.title')} <RulesHelp week={week} />
          </h1>
        </div>
      </div>

      <p className='muted invest__intro'>
        {t('lb.intro')}
      </p>

      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {!rows && !error && <p className='muted'>{t('inv.loading')}</p>}

      {rows && rows.length === 0 && (
        <section className='invest-card'>
          <p className='muted empty'>
            {t('lb.empty')}
          </p>
        </section>
      )}

      {rows && rows.length > 0 && (
        <section className='invest-card'>
          <table className='invest-table'>
            <thead>
              <tr>
                <th>{t('inv.colRank')}</th>
                <th>{t('inv.colNickname')}</th>
                <th className='num'>{t('inv.colPoints')}</th>
                <th className='num'>🥇</th>
                <th className='num'>🥈</th>
                <th className='num'>🥉</th>
                <th className='num'>{t('inv.colParticipation')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId}>
                  <td>{MEDAL[r.rank] ?? r.rank}</td>
                  <td>
                    <RankingNickname
                      userId={r.userId}
                      nickname={r.nickname}
                      withdrawn={r.nickname === '(탈퇴한 사용자)'}
                      showPortfolio={false}
                    />
                  </td>
                  <td className='num'>
                    <b>{r.totalPoints}</b>
                  </td>
                  <td className='num'>{r.firstPlaces}</td>
                  <td className='num'>{r.secondPlaces}</td>
                  <td className='num'>{r.thirdPlaces}</td>
                  <td className='num'>{t('inv.weeksN', { n: r.weeksPlayed })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
