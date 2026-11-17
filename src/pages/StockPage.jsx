import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPortfolio, getQuote, placeTrade } from '../api/invest';
import CurrencyToggle from '../components/CurrencyToggle';
import StarButton from '../components/StarButton';
import StockSearch from '../components/StockSearch';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatPercent, signClass } from '../utils/money';

const REFRESH_MS = 15_000;

export default function StockPage() {
  const { symbol: rawSymbol } = useParams();
  const symbol = (rawSymbol ?? '').toUpperCase();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { money, signedMoney } = useCurrency();
  // 주문 결과에서 t 를 변수명으로 쓰므로 번역 함수는 tr 로 받는다.
  const { t: tr, locale } = useI18n();

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
      setMessage({ type: 'error', text: tr('st.qtyInvalid') });
      return;
    }
    setSubmitting(true);
    try {
      const result = await placeTrade({ symbol, side, quantity: qty });
      const t = result.trade;
      setMessage({
        type: 'ok',
        text: tr('st.filled', {
          side: t.side === 'BUY' ? tr('pf.buy') : tr('pf.sell'),
          symbol: t.symbol,
          qty: t.quantity,
          price: money(t.price),
          amount: money(t.amount),
        }),
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
          {tr('inv.backHome')}
        </Link>
        <CurrencyToggle />
      </div>

      <StockSearch />

      {quoteError && (
        <p className='form-msg form-msg--error'>{quoteError}</p>
      )}

      {!quote && !quoteError && <p className='muted'>{tr('inv.loadingQuote')}</p>}

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
              <span className='tag'>{quote.marketOpen ? tr('st.marketOpen') : tr('st.marketClosed')}</span>
              {quote.stale && <span className='tag tag--warn'>{tr('st.staleQuote')}</span>}
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
              <dt>{tr('st.open')}</dt>
              <dd>{money(quote.open)}</dd>
            </div>
            <div>
              <dt>{tr('st.high')}</dt>
              <dd>{money(quote.high)}</dd>
            </div>
            <div>
              <dt>{tr('st.low')}</dt>
              <dd>{money(quote.low)}</dd>
            </div>
            <div>
              <dt>{tr('st.prevClose')}</dt>
              <dd>{money(quote.previousClose)}</dd>
            </div>
          </dl>

          <p className='muted quote__updated'>
            {tr('st.asOf', {
              time: new Date(quote.updatedAt).toLocaleTimeString(locale),
            })}
            {quote.tradedAt &&
              tr('st.lastTrade', {
                time: new Date(quote.tradedAt).toLocaleString(locale, {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })}
            {!quote.marketOpen && tr('st.closedNote')}
          </p>
        </section>
      )}

      {quote && (
        <section className='invest-card trade'>
          <h2 className='invest-card__title'>{tr('st.order')}</h2>

          {!isAuthenticated ? (
            <p className='muted'>
              {tr('st.loginToTrade1')}
              <Link to='/login' className='link'>
                {tr('nav.login')}
              </Link>
              {tr('st.loginToTrade2')}
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
                  {tr('pf.buy')}
                </button>
                <button
                  type='button'
                  role='tab'
                  aria-selected={side === 'SELL'}
                  className={`trade-form__tab ${side === 'SELL' ? 'is-sell' : ''}`}
                  onClick={() => setSide('SELL')}
                >
                  {tr('pf.sell')}
                </button>
              </div>

              <div className='field'>
                <label htmlFor='quantity'>{tr('st.quantity')}</label>
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
                      {tr('st.maxBuy', { n: maxBuy })}
                    </button>
                  )}
                  {side === 'SELL' && maxSell != null && (
                    <button
                      type='button'
                      className='btn btn-ghost btn-sm'
                      onClick={() => setQuantity(String(maxSell))}
                      disabled={maxSell < 1}
                    >
                      {tr('st.maxSell', { n: maxSell })}
                    </button>
                  )}
                </div>
              </div>

              <dl className='trade-form__info'>
                <div>
                  <dt>{tr('st.estimated')}</dt>
                  <dd>{estimated != null ? money(estimated) : '-'}</dd>
                </div>
                <div>
                  <dt>{tr('st.buyingPower')}</dt>
                  <dd>{account ? money(account.cash) : '-'}</dd>
                </div>
                <div>
                  <dt>{tr('st.owned')}</dt>
                  <dd>
                    {account ? tr('pf.shares', { n: account.owned }) : '-'}
                    {account?.avgCost && (
                      <span className='muted'>
                        {tr('st.avgCostNote', { price: money(account.avgCost) })}
                      </span>
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
                  ? tr('st.processing')
                  : side === 'BUY'
                    ? tr('st.submitBuy', { qty: validQty ? qty : '' })
                    : tr('st.submitSell', { qty: validQty ? qty : '' })}
              </button>
              {quote.stale && (
                <p className='muted invest-note'>
                  {tr('st.staleBlocked')}
                </p>
              )}
            </form>
          )}
        </section>
      )}
    </main>
  );
}
