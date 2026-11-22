import { useCallback, useEffect, useState } from 'react';
import { deleteAutoBuy, getAutoBuys } from '../api/invest';
import { useI18n } from '../context/LanguageContext';
import AutoBuyList from './AutoBuyList';

/** 내 자동 매수 전체 목록(포트폴리오 화면). */
export default function MyAutoBuys() {
  const { t } = useI18n();
  const [rules, setRules] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getAutoBuys()
      .then((list) => {
        if (!cancelled) setRules(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const remove = useCallback(
    async (rule) => {
      if (!window.confirm(t('ab.confirmDelete'))) return;
      try {
        await deleteAutoBuy(rule.id);
        setRules((prev) => prev.filter((r) => r.id !== rule.id));
      } catch (err) {
        setError(err.message);
      }
    },
    [t],
  );

  return (
    <section className='invest-card'>
      <h2 className='invest-card__title'>{t('ab.myTitle')}</h2>
      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {rules && <AutoBuyList rules={rules} onDelete={remove} />}
    </section>
  );
}
