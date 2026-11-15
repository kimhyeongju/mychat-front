import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard, getWeekInfo } from '../api/invest';
import RankingNickname from '../components/RankingNickname';
import RulesHelp from '../components/RulesHelp';
import usePolling from '../hooks/usePolling';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
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
            ← 투자 홈
          </Link>
          <h1 className='page__title'>
            누적 포인트 리더보드 <RulesHelp week={week} />
          </h1>
        </div>
      </div>

      <p className='muted invest__intro'>
        매주 마감 시점 수익률 1~3위에게 포인트를 드리고, 포인트를 합산한
        순위입니다. 포인트가 같으면 1위·2위·3위를 더 많이 한 사람이 앞섭니다.
      </p>

      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {!rows && !error && <p className='muted'>불러오는 중...</p>}

      {rows && rows.length === 0 && (
        <section className='invest-card'>
          <p className='muted empty'>
            아직 정산된 주가 없습니다. 첫 주간 마감 뒤에 순위가 채워집니다.
          </p>
        </section>
      )}

      {rows && rows.length > 0 && (
        <section className='invest-card'>
          <table className='invest-table'>
            <thead>
              <tr>
                <th>순위</th>
                <th>닉네임</th>
                <th className='num'>포인트</th>
                <th className='num'>🥇</th>
                <th className='num'>🥈</th>
                <th className='num'>🥉</th>
                <th className='num'>참여</th>
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
                  <td className='num'>{r.weeksPlayed}주</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
