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
import { useI18n } from '../context/LanguageContext';
import { useWatchlist } from '../context/WatchlistContext';
import usePolling from '../hooks/usePolling';
import { formatPercent, formatRate, signClass } from '../utils/money';

const POLL_MS = 30_000;
// 서버가 탈퇴한 사용자의 닉네임으로 내려주는 값.
const WITHDRAWN = '(탈퇴한 사용자)';
const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

/** "2일 3시간", "5시간 20분" 처럼 남은 시간을 짧게 보여준다. */
function formatRemaining(settlesAt, now, t) {
  const ms = new Date(settlesAt).getTime() - now;
  if (ms <= 0) return t('inv.settling');
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return t('inv.remainDH', { d: days, h: hours });
  if (hours > 0) return t('inv.remainHM', { h: hours, m: mins });
  return t('inv.remainM', { m: mins });
}

export default function InvestHomePage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { money, signedMoney } = useCurrency();
  const { t } = useI18n();
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
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
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
        <h1 className='page__title'>{t('inv.title')}</h1>
        <CurrencyToggle />
      </div>

      <p className='muted invest__intro'>
        {t('inv.intro')}
      </p>

      <StockSearch />

      {error && <p className='form-msg form-msg--error'>{error}</p>}

      {isAuthenticated ? (
        summary && (
          <section className='invest-card invest-summary'>
            <div className='invest-summary__head'>
              <h2 className='invest-card__title'>{t('inv.accountOf', { name: user?.nickname })}</h2>
              <Link to='/invest/portfolio' className='btn btn-ghost btn-sm'>
                {t('inv.holdings')}
              </Link>
            </div>
            <dl className='invest-stats'>
              <div>
                <dt>{t('inv.totalAssets')}</dt>
                <dd>{money(summary.equity)}</dd>
              </div>
              <div>
                <dt>{t('inv.returnRate')}</dt>
                <dd className={signClass(summary.returnRate)}>
                  {formatRate(summary.returnRate)}
                </dd>
              </div>
              <div>
                <dt>{t('inv.pnl')}</dt>
                <dd className={signClass(summary.profit)}>
                  {signedMoney(summary.profit)}
                </dd>
              </div>
              <div>
                <dt>{t('inv.cash')}</dt>
                <dd>{money(summary.cash)}</dd>
              </div>
            </dl>
            {summary.pricesStale && (
              <p className='muted invest-note'>
                {t('inv.staleNote')}
              </p>
            )}
          </section>
        )
      ) : (
        <section className='invest-card invest-card--cta'>
          <p>
            {t('inv.ctaLogin', { money: money(100000) })}
          </p>
          <Link to='/login' className='btn btn-solid btn-sm'>
            {t('nav.login')}
          </Link>
        </section>
      )}

      {isAuthenticated && (
        <section className='invest-card'>
          <div className='invest-summary__head'>
            <h2 className='invest-card__title'>{t('inv.watchlist')}</h2>
            <span className='muted'>{watchlist.items.length}/50</span>
          </div>
          {watchlist.loaded && watchlist.items.length === 0 ? (
            <p className='muted empty'>
              {t('inv.watchlistEmpty')}
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
                          <span className='tag tag--warn'>{t('inv.delayed')}</span>
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
              {t('inv.lastWeek')}{' '}
              <small className='muted'>
                {t('inv.closedOn', { date: week.lastWeek.weekEndDate })}
              </small>
            </h2>
            <span className='muted'>
              {t('inv.participants', { n: week.lastWeek.participantCount })}
            </span>
          </div>
          <ol className='winners'>
            {week.lastWeek.winners.map((w) => (
              <li key={w.userId}>
                <span className='winners__rank'>{MEDAL[w.rank] ?? t('inv.rankN', { n: w.rank })}</span>
                <RankingNickname
                  userId={w.userId}
                  nickname={w.nickname}
                  withdrawn={w.nickname === WITHDRAWN}
                  showPortfolio={false}
                />
                <span className={`num ${signClass(w.returnRate)}`}>
                  {formatRate(w.returnRate)}
                </span>
                <span className='muted'>{t('inv.pointsN', { n: w.points })}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className='invest-card'>
        <div className='invest-summary__head'>
          <h2 className='invest-card__title'>
            {t('inv.weeklyRanking')} <RulesHelp week={week} />
          </h2>
          <span className='muted'>
            {week &&
              t('inv.remaining', {
                time: formatRemaining(week.settlesAt, now, t),
              })}
            {ranking &&
              ` · ${t('inv.participants', { n: ranking.totalParticipants })}`}
            {' · '}
            <Link to='/invest/leaderboard' className='link'>
              {t('inv.leaderboardLink')}
            </Link>
          </span>
        </div>

        {!ranking && !error && <p className='muted'>{t('inv.loading')}</p>}

        {ranking && ranking.entries.length === 0 && (
          <p className='muted empty'>
            {t('inv.noTradersYet')}
          </p>
        )}

        {ranking && ranking.entries.length > 0 && (
          <table className='invest-table'>
            <thead>
              <tr>
                <th>{t('inv.colRank')}</th>
                <th>{t('inv.colNickname')}</th>
                <th className='num'>{t('inv.totalAssets')}</th>
                <th className='num'>{t('inv.returnRate')}</th>
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
                      withdrawn={row.nickname === WITHDRAWN}
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
            {t('inv.myRank', {
              rank: ranking.me.rank,
              rate: formatRate(ranking.me.returnRate),
            })}
          </p>
        )}
      </section>
    </main>
  );
}
