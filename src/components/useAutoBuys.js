import { useCallback, useEffect, useState } from 'react';
import { deleteAiAutoBuy, deleteAutoBuy, getAutoBuys } from '../api/invest';
import { useI18n } from '../context/LanguageContext';

/**
 * 내 자동 매수 현황(규칙, 비율 합계, 실행 내역)을 불러오고 삭제까지 맡는다.
 * enabled 가 false 면 불러오지 않고 비운다(로그인 전).
 */
export default function useAutoBuys(enabled = true) {
  const { t } = useI18n();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) {
      setOverview(null);
      return undefined;
    }
    let cancelled = false;
    getAutoBuys()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const remove = useCallback(
    async (rule) => {
      if (!window.confirm(t('ab.confirmDelete'))) return;
      try {
        await deleteAutoBuy(rule.id);
        // 비율 합계와 내역이 함께 바뀌므로 다시 불러온다.
        setOverview(await getAutoBuys());
        setError('');
      } catch (err) {
        setError(err.message);
      }
    },
    [t],
  );

  const removeAi = useCallback(
    async (rule) => {
      if (!window.confirm(t('ab.confirmDelete'))) return;
      try {
        await deleteAiAutoBuy(rule.id);
        setOverview(await getAutoBuys());
        setError('');
      } catch (err) {
        setError(err.message);
      }
    },
    [t],
  );

  return { overview, setOverview, error, setError, remove, removeAi };
}
