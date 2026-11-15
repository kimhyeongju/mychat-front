import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPortfolio, getQuote, placeTrade } from '../api/invest';
import CurrencyToggle from '../components/CurrencyToggle';
import StarButton from '../components/StarButton';
import StockSearch from '../components/StockSearch';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatPercent, signClass } from '../utils/money';

const REFRESH_MS = 15_000;

export default function StockPage() {
  const { symbol: rawSymbol } = useParams();
  const symbol = (rawSymbol ?? '').toUpperCase();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { money, signedMoney } = useCurrency();

  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [account, setAccount] = useState(null); // { cash, owned }

  const [side, setSide] = useState('BUY');
  const [quantity, setQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok'|'error', text }

  // ----- 시세: 15초마다 갱신 -----
  useEffect(() => {
    let cancelled = false;
    setQuote(null);
    setQuoteError('');

    const load = () =>
      getQuote(symbol)
        .then((q) => {
          if (!cancelled) {
            setQuote(q);
            setQuoteError('');
          }
        })
        .catch((err) => {
          if (!cancelled) setQuoteError(err.message);
        });

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [symbol]);

  // ----- 내 현금과 이 종목 보유 수량 -----
  const loadAccount = useCallback(() => {
    if (!isAuthenticated) {
      setAccount(null);
      return;
    }
    getPortfolio()
      .then((p) => {
        const position = p.positions.find((x) => x.symbol === symbol);
        setAccount({
          cash: Number(p.summary.cash),
          owned: position ? position.quantity : 0,
          avgCost: position ? position.avgCost : null,
        });
      })
      .catch(() => setAccount(null));
  }, [isAuthenticated, symbol]);

  useEffect(() => {
    if (!authLoading) loadAccount();
  }, [authLoading, loadAccount]);

  const qty = Number.parseInt(quantity, 10);
  const validQty = Number.isInteger(qty) && qty >= 1;
  const price = quote ? Number(quote.price) : null;
  const estimated = validQty && price != null ? qty * price : null;

  const maxBuy =
    account && price ? Math.floor(account.cash / price) : null;
  const maxSell = account ? account.owned : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!validQty) {
      setMessage({ type: 'error', text: '수량은 1 이상의 정수여야 합니다.' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await placeTrade({ symbol, side, quantity: qty });
      const t = result.trade;
      setMessage({
        type: 'ok',
        text: `${t.side === 'BUY' ? '매수' : '매도'} 체결: ${t.symbol} ${t.quantity}주 × ${money(t.price)} = ${money(t.amount)}`,
      });
      setQuantity('1');
      loadAccount();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className='page page--wide invest'>
      <div className='page__header'>
        <Link to='/invest' className='btn btn-ghost btn-sm'>
          ← 투자 홈
        </Link>
        <CurrencyToggle />
      </div>

      <StockSearch />

      {quoteError && (
        <p className='form-msg form-msg--error'>{quoteError}</p>
      )}

      {!quote && !quoteError && <p className='muted'>시세를 불러오는 중...</p>}

      {quote && (
        <section className='invest-card quote'>
          <div className='quote__head'>
            <div>
              <h1 className='quote__symbol'>
                {quote.symbol}{' '}
                <StarButton symbol={quote.symbol} name={quote.name} />
              </h1>
              <p className='quote__name'>{quote.name}</p>
            </div>
            <div className='quote__badges'>
              <span className='tag'>{quote.marketOpen ? '장중' : '장 마감'}</span>
              {quote.stale && <span className='tag tag--warn'>지연 시세</span>}
            </div>
          </div>

          <div className='quote__price-row'>
            <span className='quote__price'>{money(quote.price)}</span>
            <span className={`quote__change ${signClass(quote.change)}`}>
              {signedMoney(quote.change)} ({formatPercent(quote.changePercent)})
            </span>
          </div>

          <dl className='quote__details'>
            <div>
              <dt>시가</dt>
              <dd>{money(quote.open)}</dd>
            </div>
            <div>
              <dt>고가</dt>
              <dd>{money(quote.high)}</dd>
            </div>
            <div>
              <dt>저가</dt>
              <dd>{money(quote.low)}</dd>
            </div>
            <div>
              <dt>전일 종가</dt>
              <dd>{money(quote.previousClose)}</dd>
            </div>
          </dl>

          <p className='muted quote__updated'>
            {new Date(quote.updatedAt).toLocaleTimeString('ko-KR')} 기준
            {quote.tradedAt &&
              ` · 마지막 체결 ${new Date(quote.tradedAt).toLocaleString('ko-KR', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`}
            {!quote.marketOpen && ' · 장 마감 중에도 마지막 체결가로 거래됩니다'}
          </p>
        </section>
      )}

      {quote && (
        <section className='invest-card trade'>
          <h2 className='invest-card__title'>주문</h2>

          {!isAuthenticated ? (
            <p className='muted'>
              거래하려면 <Link to='/login' className='link'>로그인</Link>이
              필요합니다.
            </p>
          ) : (
            <form className='trade-form' onSubmit={handleSubmit}>
              <div className='trade-form__side' role='tablist'>
                <button
                  type='button'
                  role='tab'
                  aria-selected={side === 'BUY'}
                  className={`trade-form__tab ${side === 'BUY' ? 'is-buy' : ''}`}
                  onClick={() => setSide('BUY')}
                >
                  매수
                </button>
                <button
                  type='button'
                  role='tab'
                  aria-selected={side === 'SELL'}
                  className={`trade-form__tab ${side === 'SELL' ? 'is-sell' : ''}`}
                  onClick={() => setSide('SELL')}
                >
                  매도
                </button>
              </div>

              <div className='field'>
                <label htmlFor='quantity'>수량</label>
                <div className='trade-form__qty'>
                  <input
                    id='quantity'
                    type='number'
                    className='text-input'
                    min='1'
                    step='1'
                    inputMode='numeric'
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                  {side === 'BUY' && maxBuy != null && (
                    <button
                      type='button'
                      className='btn btn-ghost btn-sm'
                      onClick={() => setQuantity(String(Math.max(maxBuy, 0)))}
                      disabled={maxBuy < 1}
                    >
                      최대 {maxBuy}주
                    </button>
                  )}
                  {side === 'SELL' && maxSell != null && (
                    <button
                      type='button'
                      className='btn btn-ghost btn-sm'
                      onClick={() => setQuantity(String(maxSell))}
                      disabled={maxSell < 1}
                    >
                      전량 {maxSell}주
                    </button>
                  )}
                </div>
              </div>

              <dl className='trade-form__info'>
                <div>
                  <dt>예상 금액</dt>
                  <dd>{estimated != null ? money(estimated) : '-'}</dd>
                </div>
                <div>
                  <dt>주문 가능 현금</dt>
                  <dd>{account ? money(account.cash) : '-'}</dd>
                </div>
                <div>
                  <dt>보유 수량</dt>
                  <dd>
                    {account ? `${account.owned}주` : '-'}
                    {account?.avgCost && (
                      <span className='muted'> (평단 {money(account.avgCost)})</span>
                    )}
                  </dd>
                </div>
              </dl>

              {message && (
                <p
                  className={`form-msg ${
                    message.type === 'ok' ? 'form-msg--ok' : 'form-msg--error'
                  }`}
                >
                  {message.text}
                </p>
              )}

              <button
                type='submit'
                className={`btn btn-solid trade-form__submit ${
                  side === 'BUY' ? 'is-buy' : 'is-sell'
                }`}
                disabled={submitting || !validQty || quote.stale}
              >
                {submitting
                  ? '처리 중...'
                  : side === 'BUY'
                    ? `${validQty ? qty : ''}주 매수`
                    : `${validQty ? qty : ''}주 매도`}
              </button>
              {quote.stale && (
                <p className='muted invest-note'>
                  시세가 지연되어 주문을 받을 수 없습니다. 잠시 후 다시 시도해주세요.
                </p>
              )}
            </form>
          )}
        </section>
      )}
    </main>
  );
}
