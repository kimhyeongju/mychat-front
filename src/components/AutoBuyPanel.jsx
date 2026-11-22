import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createAutoBuy } from '../api/invest';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import AutoBuyHistory from './AutoBuyHistory';
import AutoBuyList from './AutoBuyList';
import AutoBuySummary from './AutoBuySummary';
import useAutoBuys from './useAutoBuys';

const QUICK_PERCENTS = [10, 25, 50];

/**
 * 종목 화면의 자동 매수 설정. 매주 월요일 장 시작 직후 총 자산의 N% 를 산다.
 * 내 모든 규칙의 비율 합계는 100% 를 넘을 수 없어서, 남은 비율을 보여주고 그 안에서만 받는다.
 */
export default function AutoBuyPanel({ symbol }) {
  const { t } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { overview, setOverview, error, setError, remove } = useAutoBuys(
    !authLoading && isAuthenticated,
  );

  const [percent, setPercent] = useState('30');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const remaining = overview ? overview.remainingPercent : 0;
  const pct = Number.parseInt(percent, 10);
  const validPercent = Number.isInteger(pct) && pct >= 1 && pct <= remaining;

  const submit = async (e) => {
    e.preventDefault();
    if (!validPercent) {
      setMessage({
        type: 'error',
        text:
          Number.isInteger(pct) && pct > remaining
            ? t('ab.percentExceeded', { n: remaining })
            : t('ab.percentInvalid', { max: remaining }),
      });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    setError('');
    try {
      setOverview(await createAutoBuy({ symbol, percent: pct }));
      setMessage({ type: 'ok', text: t('ab.added') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className='invest-card'>
      <h2 className='invest-card__title'>{t('ab.title')}</h2>
      <p className='muted invest-note'>{t('ab.desc')}</p>

      {!isAuthenticated ? (
        <p className='muted'>
          {t('ab.loginToUse1')}
          <Link to='/login' className='link'>
            {t('nav.login')}
          </Link>
          {t('ab.loginToUse2')}
        </p>
      ) : (
        overview && (
          <>
            <AutoBuySummary
              totalPercent={overview.totalPercent}
              remainingPercent={overview.remainingPercent}
            />

            {remaining > 0 && (
              <form className='auto-buy-form' onSubmit={submit}>
                <div className='field'>
                  <label htmlFor='ab-percent'>{t('ab.percent')}</label>
                  <div className='trade-form__qty'>
                    <input
                      id='ab-percent'
                      type='number'
                      className='text-input'
                      min='1'
                      max={remaining}
                      step='1'
                      inputMode='numeric'
                      value={percent}
                      onChange={(e) => setPercent(e.target.value)}
                      required
                    />
                    {QUICK_PERCENTS.filter((p) => p < remaining).map((p) => (
                      <button
                        key={p}
                        type='button'
                        className='btn btn-ghost btn-sm'
                        onClick={() => setPercent(String(p))}
                      >
                        {p}%
                      </button>
                    ))}
                    <button
                      type='button'
                      className='btn btn-ghost btn-sm'
                      onClick={() => setPercent(String(remaining))}
                    >
                      {t('ab.max')} {remaining}%
                    </button>
                  </div>
                </div>
                <p className='muted invest-note'>{t('ab.timeNote')}</p>
                <button
                  type='submit'
                  className='btn btn-solid'
                  disabled={submitting || !validPercent}
                >
                  {submitting ? t('ab.adding') : t('ab.add')}
                </button>
              </form>
            )}

            {(message || error) && (
              <p
                className={`form-msg ${
                  message?.type === 'ok' && !error
                    ? 'form-msg--ok'
                    : 'form-msg--error'
                }`}
              >
                {error || message.text}
              </p>
            )}

            <AutoBuyList rules={overview.rules} onDelete={remove} />
            <AutoBuyHistory history={overview.history} />
          </>
        )
      )}
    </section>
  );
}
