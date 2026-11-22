import { Link } from 'react-router-dom';
import { useI18n } from '../context/LanguageContext';

/** 1(월)~5(금) 을 현재 언어의 요일 이름으로. 2024-01-01 이 월요일이다. */
export function dayName(day, locale) {
  return new Date(2024, 0, day).toLocaleDateString(locale, { weekday: 'long' });
}

/** 자동 매수 규칙 목록. 규칙 문구, 다음 실행 시각, 삭제 버튼. */
export default function AutoBuyList({
  rules,
  aiRules = [],
  onDelete,
  onDeleteAi,
  showSymbol = true,
}) {
  const { t, locale } = useI18n();

  const title = <h3 className='auto-buy-history__title'>{t('ab.listTitle')}</h3>;

  const nextText = (nextRunAt) =>
    nextRunAt
      ? t('ab.next', {
          time: new Date(nextRunAt).toLocaleString(locale, {
            month: 'numeric',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        })
      : t('ab.noNext');

  if (rules.length === 0 && aiRules.length === 0) {
    return (
      <div className='auto-buy-section'>
        {title}
        <p className='muted empty'>{t('ab.empty')}</p>
      </div>
    );
  }

  return (
    <div className='auto-buy-section'>
      {title}
      <ul className='auto-buy-list'>
      {rules.map((r) => (
        <li key={r.id} className='auto-buy'>
          <div className='auto-buy__head'>
            <span>
              {showSymbol && (
                <>
                  <Link
                    to={`/invest/stocks/${encodeURIComponent(r.symbol)}`}
                    className='invest-table__symbol'
                  >
                    {r.symbol}
                  </Link>{' '}
                </>
              )}
              {t('ab.rule', {
                day: dayName(r.dayOfWeek, locale),
                percent: r.percent,
              })}
            </span>
            <button
              type='button'
              className='post__action post__action--danger'
              onClick={() => onDelete(r)}
            >
              {t('disc.delete')}
            </button>
          </div>
          <p className='muted auto-buy__next'>{nextText(r.nextRunAt)}</p>
        </li>
      ))}
      {aiRules.map((r) => (
        <li key={`ai-${r.id}`} className='auto-buy'>
          <div className='auto-buy__head'>
            <span>
              <span className='ai-badge'>AI</span>{' '}
              {t('ai.rule', {
                category:
                  r.category === 'CUSTOM' ? r.topic : t(`aic.${r.category}`),
                n: r.stockCount,
                percent: r.percent,
              })}
            </span>
            <button
              type='button'
              className='post__action post__action--danger'
              onClick={() => onDeleteAi(r)}
            >
              {t('disc.delete')}
            </button>
          </div>
          <p className='muted auto-buy__next'>
            {t('ai.perStockShort', {
              per: (r.percent / r.stockCount).toLocaleString(undefined, {
                maximumFractionDigits: 1,
              }),
            })}
            {' · '}
            {nextText(r.nextRunAt)}
          </p>
        </li>
      ))}
      </ul>
    </div>
  );
}
