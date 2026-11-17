import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPortfolio, getSplitAdjustments, getTrades } from '../api/invest';
import CurrencyToggle from '../components/CurrencyToggle';
import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../context/LanguageContext';
import usePolling from '../hooks/usePolling';
import { formatRate, signClass } from '../utils/money';

const PAGE_SIZE = 20;

function splitLabel(a, tr) {
  const n = Number(a.newRate);
  const o = Number(a.oldRate);
  return tr(n > o ? 'pf.split' : 'pf.reverseSplit', { n, o });
}

export default function PortfolioPage() {
  const { money, signedMoney } = useCurrency();
  // 아래 거래 목록에서 t 를 변수명으로 쓰므로 번역 함수는 tr 로 받는다.
  const { t: tr, locale } = useI18n();

  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades] = useState([]);
  const [tradePage, setTradePage] = useState(0);
  const [hasMoreTrades, setHasMoreTrades] = useState(false);
  const [adjustments, setAdjustments] = useState([]);
  const [error, setError] = useState('');

  const loadPortfolio = useCallback(() => {
    getPortfolio()
      .then((p) => {
        setPortfolio(p);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  // 평가액은 시세에 따라 바뀌므로 30초마다 다시 받는다.
  usePolling(loadPortfolio, 30_000);

  // 분할/병합 조정은 드물어서 한 번만 받는다. 실패해도 화면의 나머지에는 영향이 없다.
  useEffect(() => {
    getSplitAdjustments()
      .then(setAdjustments)
      .catch(() => setAdjustments([]));
  }, []);

  const loadTrades = useCallback((page) => {
    getTrades({ page, size: PAGE_SIZE })
      .then((res) => {
        setTrades((prev) => (page === 0 ? res.content : [...prev, ...res.content]));
        setTradePage(page);
        setHasMoreTrades(!res.last);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadTrades(0);
  }, [loadTrades]);

  const summary = portfolio?.summary;

  return (
    <main className='page page--wide invest'>
      <div className='page__header'>
        <div className='invest__title-row'>
          <Link to='/invest' className='btn btn-ghost btn-sm'>
            {tr('inv.backHome')}
          </Link>
          <h1 className='page__title'>{tr('pf.title')}</h1>
        </div>
        <CurrencyToggle />
      </div>

      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {!portfolio && !error && <p className='muted'>{tr('inv.loading')}</p>}

      {summary && (
        <section className='invest-card'>
          <dl className='invest-stats'>
            <div>
              <dt>{tr('inv.totalAssets')}</dt>
              <dd>{money(summary.equity)}</dd>
            </div>
            <div>
              <dt>{tr('inv.returnRate')}</dt>
              <dd className={signClass(summary.returnRate)}>
                {formatRate(summary.returnRate)}
              </dd>
            </div>
            <div>
              <dt>{tr('inv.pnl')}</dt>
              <dd className={signClass(summary.profit)}>
                {signedMoney(summary.profit)}
              </dd>
            </div>
            <div>
              <dt>{tr('inv.cash')}</dt>
              <dd>{money(summary.cash)}</dd>
            </div>
            <div>
              <dt>{tr('inv.holdingsValue')}</dt>
              <dd>{money(summary.holdingsValue)}</dd>
            </div>
            <div>
              <dt>{tr('inv.seedMoney')}</dt>
              <dd>{money(summary.seedMoney)}</dd>
            </div>
          </dl>
          {summary.pricesStale && (
            <p className='muted invest-note'>
              {tr('inv.staleNote')}
            </p>
          )}
        </section>
      )}

      {portfolio && (
        <section className='invest-card'>
          <h2 className='invest-card__title'>{tr('pf.positions')}</h2>
          {portfolio.positions.length === 0 ? (
            <p className='muted empty'>
              {tr('pf.noPositions')}{' '}
              <Link to='/invest' className='link'>
                {tr('pf.firstBuy')}
              </Link>
            </p>
          ) : (
            <div className='invest-table-wrap'>
              <table className='invest-table'>
                <thead>
                  <tr>
                    <th>{tr('pf.colSymbol')}</th>
                    <th className='num'>{tr('pf.colQty')}</th>
                    <th className='num'>{tr('pf.colAvgCost')}</th>
                    <th className='num'>{tr('pf.colPrice')}</th>
                    <th className='num'>{tr('pf.colValue')}</th>
                    <th className='num'>{tr('pf.colPnl')}</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.positions.map((p) => (
                    <tr key={p.symbol}>
                      <td>
                        <Link
                          to={`/invest/stocks/${encodeURIComponent(p.symbol)}`}
                          className='invest-table__symbol'
                        >
                          {p.symbol}
                        </Link>
                        <span className='muted invest-table__name'>{p.name}</span>
                      </td>
                      <td className='num'>{p.quantity}</td>
                      <td className='num'>{money(p.avgCost)}</td>
                      <td className='num'>
                        {p.price != null ? money(p.price) : '-'}
                        {p.stale && <span className='tag tag--warn'>{tr('inv.delayed')}</span>}
                      </td>
                      <td className='num'>{money(p.marketValue)}</td>
                      <td className={`num ${signClass(p.profit)}`}>
                        {signedMoney(p.profit)}
                        <br />
                        <small>{formatRate(p.returnRate)}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {adjustments.length > 0 && (
        <section className='invest-card'>
          <h2 className='invest-card__title'>{tr('pf.splitsTitle')}</h2>
          <ul className='split-list'>
            {adjustments.map((a, i) => (
              <li key={`${a.symbol}-${i}`} className='split-row'>
                <strong>{a.symbol}</strong>{' '}
                <span className='tag'>{splitLabel(a, tr)}</span>
                {a.skipped ? (
                  <p className='muted'>
                    {tr('pf.splitSkipped', { qty: a.qtyBefore })}
                  </p>
                ) : (
                  <p className='muted'>
                    {tr('pf.splitApplied', {
                      before: a.qtyBefore,
                      after: a.qtyAfter,
                      avgBefore: money(a.avgCostBefore),
                      avgAfter: money(a.avgCostAfter),
                    })}
                    {Number(a.cashInLieu) > 0 && (
                      <>{tr('pf.cashInLieu', { amount: money(a.cashInLieu) })}</>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className='muted split-note'>
            {tr('pf.splitNote')}
          </p>
        </section>
      )}

      <section className='invest-card'>
        <h2 className='invest-card__title'>{tr('pf.trades')}</h2>
        {trades.length === 0 ? (
          <p className='muted empty'>{tr('pf.noTrades')}</p>
        ) : (
          <>
            <ul className='trade-list'>
              {trades.map((t, i) => (
                <li key={t.id} className='trade-row'>
                  {(i === 0 || trades[i - 1].weekEndDate !== t.weekEndDate) && (
                    <span className='trade-week'>
                      {t.weekEndDate
                        ? tr('pf.weekClosed', { date: t.weekEndDate })
                        : tr('pf.earlier')}
                    </span>
                  )}
                  <span
                    className={`trade-row__side ${
                      t.side === 'BUY' ? 'is-buy' : 'is-sell'
                    }`}
                  >
                    {t.side === 'BUY' ? tr('pf.buy') : tr('pf.sell')}
                  </span>
                  <span className='trade-row__body'>
                    <Link
                      to={`/invest/stocks/${encodeURIComponent(t.symbol)}`}
                      className='invest-table__symbol'
                    >
                      {t.symbol}
                    </Link>{' '}
                    {tr('pf.shares', { n: t.quantity })} × {money(t.price)}
                  </span>
                  <span className='trade-row__amount'>{money(t.amount)}</span>
                  <span className='muted trade-row__date'>
                    {new Date(t.createdAt).toLocaleString(locale, {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
            {hasMoreTrades && (
              <button
                type='button'
                className='btn btn-ghost'
                onClick={() => loadTrades(tradePage + 1)}
              >
                {tr('pf.more')}
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}
