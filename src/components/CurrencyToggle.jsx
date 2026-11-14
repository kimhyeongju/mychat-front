import { useCurrency } from '../context/CurrencyContext';

/** USD / KRW 전환 버튼. 환율이 추정치면 작게 표시한다. */
export default function CurrencyToggle() {
  const { currency, toggle, rate, fxSource } = useCurrency();

  return (
    <div className='currency-toggle'>
      <button
        type='button'
        className='currency-toggle__btn'
        onClick={toggle}
        aria-label={`표시 통화 전환, 현재 ${currency}`}
      >
        <span className={currency === 'USD' ? 'is-active' : ''}>USD</span>
        <span className={currency === 'KRW' ? 'is-active' : ''}>KRW</span>
      </button>
      {currency === 'KRW' && rate && (
        <span className='currency-toggle__rate'>
          $1 = ₩{Math.round(rate).toLocaleString('ko-KR')}
          {fxSource === 'fallback' && ' (추정)'}
        </span>
      )}
    </div>
  );
}
