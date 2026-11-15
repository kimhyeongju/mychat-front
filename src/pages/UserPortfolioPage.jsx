import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { startDirect } from '../api/chat';
import { getUserPortfolio } from '../api/invest';
import AllocationDonut from '../components/AllocationDonut';
import { useAuth } from '../context/AuthContext';
import usePolling from '../hooks/usePolling';
import { formatRate, signClass } from '../utils/money';

const MAX_SLICES = 6; // 이 개수를 넘는 종목은 "기타 종목"으로 묶는다.

const pct = (w) => `${(Number(w) * 100).toFixed(1)}%`;

export default function UserPortfolioPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    getUserPortfolio(userId)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [userId]);

  useEffect(() => {
    setData(null);
    setError('');
    load();
  }, [load]);

  usePolling(load, 30_000);

  // 도넛 조각: 상위 종목 + 기타 + 현금. 색은 종목 순서(비중 순)에 고정된다.
  const slices = useMemo(() => {
    if (!data) return [];
    const top = data.positions.slice(0, MAX_SLICES);
    const rest = data.positions.slice(MAX_SLICES);
    const list = top.map((p, i) => ({
      key: p.symbol,
      label: p.symbol,
      weight: Number(p.weight),
      color: `var(--alloc-${i + 1})`,
    }));
    const restWeight = rest.reduce((sum, p) => sum + Number(p.weight), 0);
    if (restWeight > 0) {
      list.push({
        key: '__other',
        label: '기타 종목',
        weight: restWeight,
        color: 'var(--alloc-other)',
      });
    }
    list.push({
      key: '__cash',
      label: '현금',
      weight: Number(data.cashWeight),
      color: 'var(--alloc-cash)',
    });
    return list;
  }, [data]);

  const colorOf = (index) =>
    index < MAX_SLICES ? `var(--alloc-${index + 1})` : 'var(--alloc-other)';

  const sendDm = async () => {
    try {
      const room = await startDirect(userId);
      navigate(`/chat/dm/${room.roomId}`);
    } catch (err) {
      window.alert(err.message);
    }
  };

  const isMe = userId === user?.id;

  return (
    <main className='page page--wide invest'>
      <div className='page__header'>
        <div className='invest__title-row'>
          <Link to='/invest' className='btn btn-ghost btn-sm'>
            ← 투자 홈
          </Link>
          <h1 className='page__title'>
            {data ? `${data.nickname}님의 포트폴리오` : '포트폴리오'}
          </h1>
        </div>
        {data && !isMe && (
          <button type='button' className='btn btn-sm' onClick={sendDm}>
            DM 보내기
          </button>
        )}
      </div>

      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {!data && !error && <p className='muted'>불러오는 중...</p>}

      {data && (
        <>
          <section className='invest-card'>
            <dl className='invest-stats'>
              <div>
                <dt>순위</dt>
                <dd>{data.rank != null ? `${data.rank}위` : '-'}</dd>
              </div>
              <div>
                <dt>수익률</dt>
                <dd className={signClass(data.returnRate)}>
                  {formatRate(data.returnRate)}
                </dd>
              </div>
              <div>
                <dt>보유 종목</dt>
                <dd>{data.positions.length}개</dd>
              </div>
            </dl>
            <p className='muted invest-note'>
              다른 사용자의 포트폴리오는 종목별 비중과 수익률만 공개됩니다.
              {data.pricesStale &&
                ' 일부 종목의 시세가 최신이 아니어서 비중이 다를 수 있습니다.'}
            </p>
          </section>

          <section className='invest-card'>
            <h2 className='invest-card__title'>자산 비중</h2>
            <div className='alloc'>
              <AllocationDonut
                slices={slices}
                centerLabel='현금'
                centerValue={pct(data.cashWeight)}
              />
              {data.positions.length === 0 ? (
                <p className='muted empty'>보유 종목이 없습니다.</p>
              ) : (
                <table className='invest-table alloc__table'>
                  <thead>
                    <tr>
                      <th>종목</th>
                      <th className='num'>비중</th>
                      <th className='num'>수익률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.positions.map((p, i) => (
                      <tr key={p.symbol}>
                        <td>
                          <span
                            className='alloc__swatch'
                            style={{ background: colorOf(i) }}
                            aria-hidden='true'
                          />
                          <Link
                            to={`/invest/stocks/${encodeURIComponent(p.symbol)}`}
                            className='invest-table__symbol'
                          >
                            {p.symbol}
                          </Link>
                          <span className='muted invest-table__name'>
                            {p.name}
                          </span>
                        </td>
                        <td className='num'>{pct(p.weight)}</td>
                        <td className={`num ${signClass(p.returnRate)}`}>
                          {formatRate(p.returnRate)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <span
                          className='alloc__swatch'
                          style={{ background: 'var(--alloc-cash)' }}
                          aria-hidden='true'
                        />
                        현금
                      </td>
                      <td className='num'>{pct(data.cashWeight)}</td>
                      <td className='num'>-</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
