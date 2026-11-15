import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAccount, getRanking, getWeekInfo } from '../api/invest';
import CurrencyToggle from '../components/CurrencyToggle';
import RankingNickname from '../components/RankingNickname';
import RulesHelp from '../components/RulesHelp';
import StarButton from '../components/StarButton';
import StockSearch from '../components/StockSearch';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWatchlist } from '../context/WatchlistContext';
import usePolling from '../hooks/usePolling';
import { formatPercent, formatRate, signClass } from '../utils/money';

const POLL_MS = 30_000;
const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

/** "2일 3시간", "5시간 20분", "곧 마감" 처럼 남은 시간을 짧게 보여준다. */
function formatRemaining(settlesAt, now) {
  const ms = new Date(settlesAt).getTime() - now;
  if (ms <= 0) return '정산 중';
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${mins}분`;
  return `${mins}분`;
}

export default function InvestHomePage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { money, signedMoney } = useCurrency();
  const watchlist = useWatchlist();

  const [summary, setSummary] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [week, setWeek] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState('');

  const loadAccount = useCallback(() => {
    if (!isAuthenticated) {
      setSummary(null);
      return;
    }
    getAccount()
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, [isAuthenticated]);

  const loadRanking = useCallback(() => {
    getRanking()
      .then((r) => {
        setRanking(r);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, []);

  const loadWeek = useCallback(() => {
    getWeekInfo()
      .then(setWeek)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  // 정산까지 남은 시간을 1분마다 다시 계산한다.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // 내 계좌 요약. 처음 들어오면 서버가 계좌를 자동으로 연다.
  useEffect(() => {
    if (!authLoading) loadAccount();
  }, [authLoading, loadAccount]);

  useEffect(() => {
    if (!authLoading) loadRanking();
  }, [authLoading, isAuthenticated, loadRanking]);

  // 서버 랭킹 캐시가 20초라 30초마다 다시 받으면 거의 실시간으로 보인다.
  usePolling(
    () => {
      loadAccount();
      loadRanking();
      loadWeek();
      watchlist.reload();
    },
    POLL_MS,
    !authLoading,
  );

  return (
    <main className='page page--wide invest'>
      <div className='page__header'>
        <h1 className='page__title'>모의 투자</h1>
        <CurrencyToggle />
      </div>

      <p className='muted invest__intro'>
        가상 자금으로 미국 주식을 사고팔아 수익률을 겨루는 곳입니다. 실제 돈은
        오가지 않습니다.
      </p>

      <StockSearch />

      {error && <p className='form-msg form-msg--error'>{error}</p>}

      {isAuthenticated ? (
        summary && (
          <section className='invest-card invest-summary'>
            <div className='invest-summary__head'>
              <h2 className='invest-card__title'>{user?.nickname}님의 계좌</h2>
              <Link to='/invest/portfolio' className='btn btn-ghost btn-sm'>
                보유 현황
              </Link>
            </div>
            <dl className='invest-stats'>
              <div>
                <dt>총 자산</dt>
                <dd>{money(summary.equity)}</dd>
              </div>
              <div>
                <dt>수익률</dt>
                <dd className={signClass(summary.returnRate)}>
                  {formatRate(summary.returnRate)}
                </dd>
              </div>
              <div>
                <dt>평가 손익</dt>
                <dd className={signClass(summary.profit)}>
                  {signedMoney(summary.profit)}
                </dd>
              </div>
              <div>
                <dt>현금</dt>
                <dd>{money(summary.cash)}</dd>
              </div>
            </dl>
            {summary.pricesStale && (
              <p className='muted invest-note'>
                일부 종목의 시세가 최신이 아니어서 평가액이 다를 수 있습니다.
              </p>
            )}
          </section>
        )
      ) : (
        <section className='invest-card invest-card--cta'>
          <p>
            로그인하면 {money(100000)}의 가상 자금으로 바로 시작할 수 있습니다.
          </p>
          <Link to='/login' className='btn btn-solid btn-sm'>
            로그인
          </Link>
        </section>
      )}

      {isAuthenticated && (
        <section className='invest-card'>
          <div className='invest-summary__head'>
            <h2 className='invest-card__title'>관심 종목</h2>
            <span className='muted'>{watchlist.items.length}/50</span>
          </div>
          {watchlist.loaded && watchlist.items.length === 0 ? (
            <p className='muted empty'>
              종목 화면이나 검색 결과의 ☆ 를 눌러 관심 종목을 담아보세요. 주간
              초기화 뒤에도 남습니다.
            </p>
          ) : (
            <div className='invest-table-wrap'>
              <table className='invest-table'>
                <tbody>
                  {watchlist.items.map((w) => (
                    <tr key={w.symbol}>
                      <td>
                        <Link
                          to={`/invest/stocks/${encodeURIComponent(w.symbol)}`}
                          className='invest-table__symbol'
                        >
                          {w.symbol}
                        </Link>
                        <span className='muted invest-table__name'>{w.name}</span>
                      </td>
                      <td className='num'>
                        {w.price != null ? money(w.price) : '-'}
                        {w.stale && w.price != null && (
                          <span className='tag tag--warn'>지연</span>
                        )}
                      </td>
                      <td className={`num ${signClass(w.change)}`}>
                        {w.changePercent != null
                          ? formatPercent(w.changePercent)
                          : '-'}
                      </td>
                      <td className='num'>
                        <StarButton symbol={w.symbol} name={w.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {week?.lastWeek && week.lastWeek.winners.length > 0 && (
        <section className='invest-card'>
          <div className='invest-summary__head'>
            <h2 className='invest-card__title'>
              지난주 결과 <small className='muted'>({week.lastWeek.weekEndDate} 마감)</small>
            </h2>
            <span className='muted'>참여 {week.lastWeek.participantCount}명</span>
          </div>
          <ol className='winners'>
            {week.lastWeek.winners.map((w) => (
              <li key={w.userId}>
                <span className='winners__rank'>{MEDAL[w.rank] ?? `${w.rank}위`}</span>
                <RankingNickname
                  userId={w.userId}
                  nickname={w.nickname}
                  withdrawn={w.nickname === '(탈퇴한 사용자)'}
                  showPortfolio={false}
                />
                <span className={`num ${signClass(w.returnRate)}`}>
                  {formatRate(w.returnRate)}
                </span>
                <span className='muted'>+{w.points}점</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className='invest-card'>
        <div className='invest-summary__head'>
          <h2 className='invest-card__title'>
            이번 주 수익률 랭킹 <RulesHelp week={week} />
          </h2>
          <span className='muted'>
            {week && `마감까지 ${formatRemaining(week.settlesAt, now)}`}
            {ranking && ` · 참여 ${ranking.totalParticipants}명`}
            {' · '}
            <Link to='/invest/leaderboard' className='link'>
              누적 포인트 리더보드
            </Link>
          </span>
        </div>

        {!ranking && !error && <p className='muted'>불러오는 중...</p>}

        {ranking && ranking.entries.length === 0 && (
          <p className='muted empty'>
            이번 주 거래한 사람이 아직 없습니다. 첫 거래를 하면 랭킹에 올라갑니다.
          </p>
        )}

        {ranking && ranking.entries.length > 0 && (
          <table className='invest-table'>
            <thead>
              <tr>
                <th>순위</th>
                <th>닉네임</th>
                <th className='num'>총 자산</th>
                <th className='num'>수익률</th>
              </tr>
            </thead>
            <tbody>
              {ranking.entries.map((row) => (
                <tr
                  key={row.userId}
                  className={row.userId === user?.id ? 'is-me' : ''}
                >
                  <td>{row.rank}</td>
                  <td>
                    <RankingNickname
                      userId={row.userId}
                      nickname={row.nickname}
                      withdrawn={row.nickname === '(탈퇴한 사용자)'}
                    />
                  </td>
                  <td className='num'>{money(row.equity)}</td>
                  <td className={`num ${signClass(row.returnRate)}`}>
                    {formatRate(row.returnRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {ranking?.me && ranking.me.rank > ranking.entries.length && (
          <p className='muted invest-note'>
            내 순위: {ranking.me.rank}위 ({formatRate(ranking.me.returnRate)})
          </p>
        )}
      </section>
    </main>
  );
}
