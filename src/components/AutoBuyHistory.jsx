import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../context/LanguageContext';

/** 모든 종목을 합친 자동 매수 실행 내역(최신순). */
export default function AutoBuyHistory({ history }) {
  const { t, locale } = useI18n();
  const { money } = useCurrency();

  const dateText = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    });

  return (
    <div className='auto-buy-history'>
      <h3 className='auto-buy-history__title'>{t('ab.historyTitle')}</h3>
      {history.length === 0 ? (
        <p className='muted empty'>{t('ab.historyEmpty')}</p>
      ) : (
        <ul className='auto-buy__runs'>
          {history.map((run) => {
            const executed = run.status === 'EXECUTED';
            return (
              <li
                key={`${run.autoBuyId}-${run.weekEndDate}`}
                className={executed ? '' : 'muted'}
              >
                <span className='auto-buy__date'>{dateText(run.runDate)}</span>{' '}
                <Link
                  to={`/invest/stocks/${encodeURIComponent(run.symbol)}`}
                  className='invest-table__symbol'
                >
                  {run.symbol}
                </Link>{' '}
                {executed
                  ? t('ab.runExecuted', {
                      n: run.quantity,
                      price: money(run.price),
                    })
                  : t('ab.runSkipped', {
                      reason: t(`ab.reason.${run.reason}`),
                    })}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
