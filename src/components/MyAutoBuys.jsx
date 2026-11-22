import { useI18n } from '../context/LanguageContext';
import AutoBuyHistory from './AutoBuyHistory';
import AutoBuyList from './AutoBuyList';
import AutoBuySummary from './AutoBuySummary';
import useAutoBuys from './useAutoBuys';

/** 내 자동 매수 전체 현황(포트폴리오 화면): 비율 배정, 규칙, 실행 내역. */
export default function MyAutoBuys() {
  const { t } = useI18n();
  const { overview, error, remove } = useAutoBuys(true);

  return (
    <section className='invest-card'>
      <h2 className='invest-card__title'>{t('ab.myTitle')}</h2>
      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {overview && (
        <>
          <AutoBuySummary
            totalPercent={overview.totalPercent}
            remainingPercent={overview.remainingPercent}
          />
          <AutoBuyList rules={overview.rules} onDelete={remove} />
          <AutoBuyHistory history={overview.history} />
        </>
      )}
    </section>
  );
}
