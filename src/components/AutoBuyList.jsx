import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../context/LanguageContext';

/** 1(월)~5(금) 을 현재 언어의 요일 이름으로. 2024-01-01 이 월요일이다. */
export function dayName(day, locale) {
  return new Date(2024, 0, day).toLocaleDateString(locale, { weekday: 'long' });
}

/** 자동 매수 규칙 목록. 규칙 문구, 다음 실행 시각, 최근 결과, 삭제 버튼. */
export default function AutoBuyList({ rules, onDelete, showSymbol = true }) {
  const { t, locale } = useI18n();
  const { money } = useCurrency();

  if (rules.length === 0) {
    return <p className='muted empty'>{t('ab.empty')}</p>;
  }

  const runText = (run) => {
    const date = run.runDate;
    if (run.status === 'EXECUTED') {
      return t('ab.runExecuted', {
        date,
        n: run.quantity,
        price: money(run.price),
      });
    }
    return t('ab.runSkipped', {
      date,
      reason: t(`ab.reason.${run.reason}`),
    });
  };

  return (
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
          <p className='muted auto-buy__next'>
            {r.nextRunAt
              ? t('ab.next', {
                  time: new Date(r.nextRunAt).toLocaleString(locale, {
                    month: 'numeric',
                    day: 'numeric',
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                })
              : t('ab.noNext')}
          </p>
          {r.recentRuns.length > 0 && (
            <ul className='auto-buy__runs'>
              {r.recentRuns.map((run) => (
                <li
                  key={run.weekEndDate}
                  className={run.status === 'EXECUTED' ? '' : 'muted'}
                >
                  {runText(run)}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
