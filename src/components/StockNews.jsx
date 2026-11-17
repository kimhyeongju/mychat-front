import { useEffect, useState } from 'react';
import { getStockNews } from '../api/invest';
import { useI18n } from '../context/LanguageContext';

/** 종목 뉴스(Benzinga via Alpaca). 제목은 원문 링크로 연결하고, 요약은 일반 텍스트로만 그린다. */
export default function StockNews({ symbol }) {
  const { t, locale } = useI18n();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError('');
    getStockNews(symbol)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (error) return <p className='form-msg form-msg--error'>{error}</p>;
  if (!items) return <p className='muted'>{t('inv.loading')}</p>;
  if (items.length === 0) return <p className='muted empty'>{t('news.empty')}</p>;

  return (
    <>
      <ul className='news-list'>
        {items.map((n) => (
          <li key={n.id} className='news-item'>
            {n.url ? (
              <a
                href={n.url}
                target='_blank'
                rel='noopener noreferrer nofollow'
                className='news-item__title'
              >
                {n.headline}
              </a>
            ) : (
              <span className='news-item__title'>{n.headline}</span>
            )}
            <span className='muted news-item__meta'>
              {[
                n.source,
                n.createdAt &&
                  new Date(n.createdAt).toLocaleString(locale, {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            {n.summary && <p className='news-item__summary'>{n.summary}</p>}
          </li>
        ))}
      </ul>
      <p className='muted invest-note'>{t('news.note')}</p>
    </>
  );
}
