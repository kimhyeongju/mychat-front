import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { startDirect } from '../api/chat';
import { getUserPortfolio } from '../api/invest';
import AllocationDonut from '../components/AllocationDonut';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import usePolling from '../hooks/usePolling';
import { formatRate, signClass } from '../utils/money';

const MAX_SLICES = 6; // 이 개수를 넘는 종목은 "기타 종목"으로 묶는다.

const pct = (w) => `${(Number(w) * 100).toFixed(1)}%`;

export default function UserPortfolioPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
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
        label: t('inv.otherStocks'),
        weight: restWeight,
        color: 'var(--alloc-other)',
      });
    }
    list.push({
      key: '__cash',
      label: t('up.cash'),
      weight: Number(data.cashWeight),
      color: 'var(--alloc-cash)',
    });
    return list;
  }, [data, t]);

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
  const displayName =
    data?.nickname === '(탈퇴한 사용자)'
      ? t('inv.withdrawnUser')
      : data?.nickname;

  return (
    <main className='page page--wide invest'>
      <div className='page__header'>
        <div className='invest__title-row'>
          <Link to='/invest' className='btn btn-ghost btn-sm'>
            {t('inv.backHome')}
          </Link>
          <h1 className='page__title'>
            {data
              ? t('up.title', { name: displayName })
              : t('up.titleDefault')}
          </h1>
        </div>
        {data && !isMe && (
          <button type='button' className='btn btn-sm' onClick={sendDm}>
            {t('inv.menuDm')}
          </button>
        )}
      </div>

      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {!data && !error && <p className='muted'>{t('inv.loading')}</p>}

      {data && (
        <>
          <section className='invest-card'>
            <dl className='invest-stats'>
              <div>
                <dt>{t('up.rank')}</dt>
                <dd>{data.rank != null ? t('inv.rankN', { n: data.rank }) : '-'}</dd>
              </div>
              <div>
                <dt>{t('inv.returnRate')}</dt>
                <dd className={signClass(data.returnRate)}>
                  {formatRate(data.returnRate)}
                </dd>
              </div>
              <div>
                <dt>{t('up.positionsCount')}</dt>
                <dd>{t('inv.countN', { n: data.positions.length })}</dd>
              </div>
            </dl>
            <p className='muted invest-note'>
              {t('up.privacy')}
              {data.pricesStale &&
                t('inv.staleWeightNote')}
            </p>
          </section>

          <section className='invest-card'>
            <h2 className='invest-card__title'>{t('up.allocation')}</h2>
            <div className='alloc'>
              <AllocationDonut
                slices={slices}
                centerLabel={t('up.cash')}
                centerValue={pct(data.cashWeight)}
              />
              {data.positions.length === 0 ? (
                <p className='muted empty'>{t('pf.noPositions')}</p>
              ) : (
                <table className='invest-table alloc__table'>
                  <thead>
                    <tr>
                      <th>{t('pf.colSymbol')}</th>
                      <th className='num'>{t('up.weight')}</th>
                      <th className='num'>{t('inv.returnRate')}</th>
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
                        {t('up.cash')}
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
