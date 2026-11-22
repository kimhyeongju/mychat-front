import { useI18n } from '../context/LanguageContext';

/** 자동 매수 비율 배정 현황: 합계 막대와 "추가 가능 N%". */
export default function AutoBuySummary({ totalPercent, remainingPercent }) {
  const { t } = useI18n();
  const filled = Math.min(100, totalPercent);

  return (
    <div className='auto-buy-summary'>
      <div className='auto-buy-summary__text'>
        <span>{t('ab.allocated', { total: totalPercent })}</span>
        <span className='muted'>
          {remainingPercent > 0
            ? t('ab.remaining', { n: remainingPercent })
            : t('ab.full')}
        </span>
      </div>
      <div
        className='auto-buy-meter'
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={filled}
      >
        <div className='auto-buy-meter__fill' style={{ width: `${filled}%` }} />
      </div>
    </div>
  );
}
