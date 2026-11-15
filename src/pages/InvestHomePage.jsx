import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAccount, getRanking } from '../api/invest';
import CurrencyToggle from '../components/CurrencyToggle';
import RankingNickname from '../components/RankingNickname';
import StockSearch from '../components/StockSearch';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatRate, signClass } from '../utils/money';

export default function InvestHomePage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { money, signedMoney } = useCurrency();

  const [summary, setSummary] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [error, setError] = useState('');

  // 내 계좌 요약. 처음 들어오면 서버가 계좌를 자동으로 연다.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setSummary(null);
      return;
    }
    getAccount()
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    getRanking()
      .then(setRanking)
      .catch((err) => setError(err.message));
  }, [authLoading, isAuthenticated]);

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

      <section className='invest-card'>
        <div className='invest-summary__head'>
          <h2 className='invest-card__title'>수익률 랭킹</h2>
          {ranking && (
            <span className='muted'>참여 {ranking.totalParticipants}명</span>
          )}
        </div>

        {!ranking && !error && <p className='muted'>불러오는 중...</p>}

        {ranking && ranking.entries.length === 0 && (
          <p className='muted empty'>아직 참여자가 없습니다. 첫 거래를 해보세요.</p>
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
