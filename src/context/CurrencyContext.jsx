import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getFx } from '../api/invest';
import { formatMoney, formatSignedMoney } from '../utils/money';

const STORAGE_KEY = 'playground_currency';
const CurrencyContext = createContext(null);

/**
 * 투자 화면의 표시 통화(USD/KRW)와 환율을 들고 있다.
 * 선택은 브라우저에 저장되고, 환율은 서버에서 받아 30분마다 다시 확인한다.
 */
export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'KRW' ? 'KRW' : 'USD';
  });
  const [fx, setFx] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getFx()
        .then((data) => {
          if (!cancelled) setFx(data);
        })
        .catch(() => {});

    load();
    const timer = setInterval(load, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const toggle = useCallback(() => {
    setCurrency((prev) => {
      const next = prev === 'USD' ? 'KRW' : 'USD';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const rate = fx?.rate ? Number(fx.rate) : null;

  const value = useMemo(
    () => ({
      currency,
      toggle,
      rate,
      fxSource: fx?.source ?? null,
      money: (usd) => formatMoney(usd, currency, rate),
      signedMoney: (usd) => formatSignedMoney(usd, currency, rate),
    }),
    [currency, toggle, rate, fx],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx)
    throw new Error('useCurrency는 CurrencyProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
}
