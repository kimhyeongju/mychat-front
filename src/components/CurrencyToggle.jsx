import { useCurrency } from '../context/CurrencyContext';
import { useI18n } from '../context/LanguageContext';

/** USD / KRW 전환 버튼. 환율이 추정치면 작게 표시한다. */
export default function CurrencyToggle() {
  const { currency, toggle, rate, fxSource } = useCurrency();
  const { t, locale } = useI18n();

  return (
    <div className='currency-toggle'>
      <button
        type='button'
        className='currency-toggle__btn'
        onClick={toggle}
        aria-label={t('inv.currencyToggle', { cur: currency })}
      >
        <span className={currency === 'USD' ? 'is-active' : ''}>USD</span>
        <span className={currency === 'KRW' ? 'is-active' : ''}>KRW</span>
      </button>
      {currency === 'KRW' && rate && (
        <span className='currency-toggle__rate'>
          $1 = ₩{Math.round(rate).toLocaleString(locale)}
          {fxSource === 'fallback' && ` ${t('inv.estimated')}`}
        </span>
      )}
    </div>
  );
}
