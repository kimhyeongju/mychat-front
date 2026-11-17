import { useEffect, useRef, useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../context/LanguageContext';

/** 작은 "?" 버튼. 누르면 주간 대회 규칙을 보여준다. week 는 GET /api/invest/week 응답. */
export default function RulesHelp({ week }) {
  const { money } = useCurrency();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const points = week?.points ?? [3, 2, 1];
  // 마감 시각은 언어와 상관없이 한국 시간으로 보여준다.
  const kst = new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  });
  const pointList = points
    .map((p, i) => t('rules.pt', { rank: i + 1, p }))
    .join(', ');

  return (
    <span className='rules-help' ref={ref}>
      <button
        type='button'
        className='rules-help__btn'
        aria-label={t('inv.rulesOpen')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <div
          className='rules-help__panel'
          role='dialog'
          aria-label={t('inv.rulesTitle')}
        >
          <h3>{t('inv.rulesTitle')}</h3>
          <ul>
            <li>
              {t('rules.l1a')}
              <b>{t('rules.l1b')}</b>
              {t('rules.l1c')}
              {week?.settlesAt &&
                t('rules.settles', { date: kst.format(new Date(week.settlesAt)) })}
            </li>
            <li>
              {t('rules.l2a')}
              <b>{t('rules.l2b')}</b>
              {t('rules.l2c', { list: pointList })}
            </li>
            <li>
              {t('rules.l3a')}
              <b>{t('rules.l3b')}</b>
              {t('rules.l3c')}
            </li>
            <li>
              {t('rules.l4a')}
              <b>{money(week?.seedMoney ?? 100000)}</b>
              {t('rules.l4c')}
            </li>
            <li>{t('rules.l5')}</li>
            <li>{t('rules.l6')}</li>
          </ul>
        </div>
      )}
    </span>
  );
}
