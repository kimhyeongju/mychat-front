import { useState } from 'react';
import { createAiAutoBuy } from '../api/invest';
import { useI18n } from '../context/LanguageContext';
import {
  AI_CATEGORY_GROUPS,
  MAX_STOCK_COUNT,
  MAX_TOPIC_LENGTH,
  usesAi,
} from './aiCategories';

const QUICK_PERCENTS = [30, 50, 90];

/**
 * AI 추천 자동 매수 설정: 카테고리, 추천받을 종목 수(1~5), 전체 비율을 정한다.
 * 비율은 고른 종목에 균등하게 나뉘고, 내 모든 규칙의 합이 100% 를 넘을 수 없어 남은 비율 안에서만 받는다.
 */
export default function AiAutoBuyForm({ overview, onCreated }) {
  const { t } = useI18n();
  const [category, setCategory] = useState('SEMICONDUCTOR');
  const [topic, setTopic] = useState('');
  const [stockCount, setStockCount] = useState(3);
  const [percent, setPercent] = useState(() =>
    String(Math.max(1, Math.min(30, overview.remainingPercent))),
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const remaining = overview.remainingPercent;
  const aiOk = overview.aiEnabled;
  const needsAi = usesAi(category);

  const pct = Number.parseInt(percent, 10);
  const pctValid = Number.isInteger(pct) && pct >= 1 && pct <= remaining;
  const enoughPerStock = pctValid && pct >= stockCount;
  const topicOk = category !== 'CUSTOM' || topic.trim().length > 0;
  const canSubmit =
    !submitting && pctValid && enoughPerStock && topicOk && (aiOk || !needsAi);

  const perStock = pctValid
    ? (pct / stockCount).toLocaleString(undefined, {
        maximumFractionDigits: 1,
      })
    : '-';

  const submit = async (e) => {
    e.preventDefault();
    if (!pctValid) {
      setMessage({
        type: 'error',
        text:
          Number.isInteger(pct) && pct > remaining
            ? t('ab.percentExceeded', { n: remaining })
            : t('ab.percentInvalid', { max: remaining }),
      });
      return;
    }
    if (!enoughPerStock) {
      setMessage({ type: 'error', text: t('ai.percentTooSmall', { n: stockCount }) });
      return;
    }
    if (!topicOk) {
      setMessage({ type: 'error', text: t('ai.topicRequired') });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const data = await createAiAutoBuy({
        category,
        topic: category === 'CUSTOM' ? topic.trim() : undefined,
        stockCount,
        percent: pct,
      });
      onCreated(data);
      // 남은 비율이 줄었으니 입력값도 그 안으로 맞춘다.
      setPercent(String(Math.max(1, Math.min(pct, data.remainingPercent))));
      setMessage({ type: 'ok', text: t('ai.added') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className='auto-buy-form ai-form' onSubmit={submit}>
      <h3 className='auto-buy-history__title'>{t('ai.title')}</h3>
      <p className='muted invest-note'>{t('ai.desc')}</p>
      {!aiOk && <p className='muted invest-note'>{t('ai.unavailable')}</p>}

      <div className='field'>
        <span className='field-label'>{t('ai.category')}</span>
        {AI_CATEGORY_GROUPS.map((group) => (
          <div key={group.key} className='ai-group'>
            <span className='muted ai-group__title'>
              {t(`aic.group.${group.key}`)}
            </span>
            <div className='ai-chips' role='group'>
              {group.codes.map((code) => {
                const disabled = usesAi(code) && !aiOk;
                return (
                  <button
                    key={code}
                    type='button'
                    className={`ai-chip${category === code ? ' ai-chip--on' : ''}`}
                    aria-pressed={category === code}
                    disabled={disabled}
                    onClick={() => setCategory(code)}
                  >
                    {t(`aic.${code}`)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <p className='muted invest-note'>
          {needsAi ? t('ai.timeNoteAi') : t('ai.timeNoteData')}
        </p>
      </div>

      {category === 'CUSTOM' && (
        <div className='field'>
          <label htmlFor='ai-topic'>{t('aic.CUSTOM')}</label>
          <input
            id='ai-topic'
            type='text'
            className='text-input'
            maxLength={MAX_TOPIC_LENGTH}
            placeholder={t('ai.topicPlaceholder')}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
      )}

      <div className='field'>
        <span className='field-label'>{t('ai.stockCount')}</span>
        <div className='ai-chips' role='group'>
          {Array.from({ length: MAX_STOCK_COUNT }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type='button'
              className={`ai-chip${stockCount === n ? ' ai-chip--on' : ''}`}
              aria-pressed={stockCount === n}
              onClick={() => setStockCount(n)}
            >
              {t('ai.countN', { n })}
            </button>
          ))}
        </div>
      </div>

      <div className='field'>
        <label htmlFor='ai-percent'>{t('ai.percent')}</label>
        <div className='trade-form__qty'>
          <input
            id='ai-percent'
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
        <p className='muted invest-note'>
          {t('ai.perStock', { per: perStock, total: pctValid ? pct : '-', n: stockCount })}
        </p>
      </div>

      {message && (
        <p
          className={`form-msg ${
            message.type === 'ok' ? 'form-msg--ok' : 'form-msg--error'
          }`}
        >
          {message.text}
        </p>
      )}
      <button type='submit' className='btn btn-solid' disabled={!canSubmit}>
        {submitting ? t('ai.adding') : t('ai.add')}
      </button>
    </form>
  );
}
