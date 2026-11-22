import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createAutoBuy, deleteAutoBuy, getAutoBuys } from '../api/invest';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import AutoBuyList, { dayName } from './AutoBuyList';

const DAYS = [1, 2, 3, 4, 5];
const QUICK_PERCENTS = [10, 25, 50];

/** 종목 화면의 자동 매수 설정: 요일과 총 자산 대비 비율을 정해 규칙을 만든다. */
export default function AutoBuyPanel({ symbol }) {
  const { t, locale } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [rules, setRules] = useState([]);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [percent, setPercent] = useState('30');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setRules([]);
      return undefined;
    }
    let cancelled = false;
    getAutoBuys()
      .then((list) => {
        if (!cancelled) setRules(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  const pct = Number.parseInt(percent, 10);
  const validPercent = Number.isInteger(pct) && pct >= 1 && pct <= 100;

  const submit = async (e) => {
    e.preventDefault();
    if (!validPercent) {
      setMessage({ type: 'error', text: t('ab.percentInvalid') });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const created = await createAutoBuy({ symbol, dayOfWeek, percent: pct });
      setRules((prev) => [created, ...prev]);
      setMessage({ type: 'ok', text: t('ab.added') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = useCallback(
    async (rule) => {
      if (!window.confirm(t('ab.confirmDelete'))) return;
      try {
        await deleteAutoBuy(rule.id);
        setRules((prev) => prev.filter((r) => r.id !== rule.id));
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      }
    },
    [t],
  );

  const mine = rules.filter((r) => r.symbol === symbol);

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
        <>
          <form className='auto-buy-form' onSubmit={submit}>
            <div className='field'>
              <label htmlFor='ab-day'>{t('ab.day')}</label>
              <select
                id='ab-day'
                className='text-input'
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {dayName(d, locale)}
                  </option>
                ))}
              </select>
            </div>
            <div className='field'>
              <label htmlFor='ab-percent'>{t('ab.percent')}</label>
              <div className='trade-form__qty'>
                <input
                  id='ab-percent'
                  type='number'
                  className='text-input'
                  min='1'
                  max='100'
                  step='1'
                  inputMode='numeric'
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  required
                />
                {QUICK_PERCENTS.map((p) => (
                  <button
                    key={p}
                    type='button'
                    className='btn btn-ghost btn-sm'
                    onClick={() => setPercent(String(p))}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
            <p className='muted invest-note'>{t('ab.timeNote')}</p>
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
              className='btn btn-solid'
              disabled={submitting || !validPercent}
            >
              {submitting ? t('ab.adding') : t('ab.add')}
            </button>
          </form>

          {mine.length > 0 && (
            <AutoBuyList rules={mine} onDelete={remove} showSymbol={false} />
          )}
        </>
      )}
    </section>
  );
}
