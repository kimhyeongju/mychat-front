import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPortfolio, getSplitAdjustments, getTrades } from '../api/invest';
import CurrencyToggle from '../components/CurrencyToggle';
import { useCurrency } from '../context/CurrencyContext';
import usePolling from '../hooks/usePolling';
import { formatRate, signClass } from '../utils/money';

const PAGE_SIZE = 20;

function splitLabel(a) {
  const n = Number(a.newRate);
  const o = Number(a.oldRate);
  return n > o ? `${n}대 ${o} 분할` : `${n}대 ${o} 병합`;
}

export default function PortfolioPage() {
  const { money, signedMoney } = useCurrency();

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
            ← 투자 홈
          </Link>
          <h1 className='page__title'>내 포트폴리오</h1>
        </div>
        <CurrencyToggle />
      </div>

      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {!portfolio && !error && <p className='muted'>불러오는 중...</p>}

      {summary && (
        <section className='invest-card'>
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
            <div>
              <dt>주식 평가액</dt>
              <dd>{money(summary.holdingsValue)}</dd>
            </div>
            <div>
              <dt>시작 자금</dt>
              <dd>{money(summary.seedMoney)}</dd>
            </div>
          </dl>
          {summary.pricesStale && (
            <p className='muted invest-note'>
              일부 종목의 시세가 최신이 아니어서 평가액이 다를 수 있습니다.
            </p>
          )}
        </section>
      )}

      {portfolio && (
        <section className='invest-card'>
          <h2 className='invest-card__title'>보유 종목</h2>
          {portfolio.positions.length === 0 ? (
            <p className='muted empty'>
              보유 종목이 없습니다.{' '}
              <Link to='/invest' className='link'>
                종목을 검색해 첫 매수를 해보세요.
              </Link>
            </p>
          ) : (
            <div className='invest-table-wrap'>
              <table className='invest-table'>
                <thead>
                  <tr>
                    <th>종목</th>
                    <th className='num'>수량</th>
                    <th className='num'>평균 단가</th>
                    <th className='num'>현재가</th>
                    <th className='num'>평가액</th>
                    <th className='num'>손익</th>
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
                        {p.stale && <span className='tag tag--warn'>지연</span>}
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
          <h2 className='invest-card__title'>이번 주 분할·병합 조정</h2>
          <ul className='split-list'>
            {adjustments.map((a, i) => (
              <li key={`${a.symbol}-${i}`} className='split-row'>
                <strong>{a.symbol}</strong>{' '}
                <span className='tag'>{splitLabel(a)}</span>
                {a.skipped ? (
                  <p className='muted'>
                    분할 정보를 늦게 알게 되어 자동 조정하지 못했습니다. 보유 수량 {a.qtyBefore}주는 그대로입니다.
                  </p>
                ) : (
                  <p className='muted'>
                    {a.qtyBefore}주 → {a.qtyAfter}주, 평균 단가 {money(a.avgCostBefore)} →{' '}
                    {money(a.avgCostAfter)}
                    {Number(a.cashInLieu) > 0 && (
                      <> · 소수 주 현금 정산 {money(a.cashInLieu)}</>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className='muted split-note'>
            수익률은 조정 전과 같게 유지됩니다.
          </p>
        </section>
      )}

      <section className='invest-card'>
        <h2 className='invest-card__title'>거래 내역</h2>
        {trades.length === 0 ? (
          <p className='muted empty'>아직 거래가 없습니다.</p>
        ) : (
          <>
            <ul className='trade-list'>
              {trades.map((t, i) => (
                <li key={t.id} className='trade-row'>
                  {(i === 0 || trades[i - 1].weekEndDate !== t.weekEndDate) && (
                    <span className='trade-week'>
                      {t.weekEndDate ? `${t.weekEndDate} 마감 주` : '이전 기록'}
                    </span>
                  )}
                  <span
                    className={`trade-row__side ${
                      t.side === 'BUY' ? 'is-buy' : 'is-sell'
                    }`}
                  >
                    {t.side === 'BUY' ? '매수' : '매도'}
                  </span>
                  <span className='trade-row__body'>
                    <Link
                      to={`/invest/stocks/${encodeURIComponent(t.symbol)}`}
                      className='invest-table__symbol'
                    >
                      {t.symbol}
                    </Link>{' '}
                    {t.quantity}주 × {money(t.price)}
                  </span>
                  <span className='trade-row__amount'>{money(t.amount)}</span>
                  <span className='muted trade-row__date'>
                    {new Date(t.createdAt).toLocaleString('ko-KR', {
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
                더 보기
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}
