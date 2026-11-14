const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const krwFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

/**
 * USD 금액을 선택한 통화로 표시한다. 장부는 항상 USD 이므로 KRW 는 표시 시점에만 환산한다.
 * @param {number|string|null} usd
 * @param {'USD'|'KRW'} currency
 * @param {number|null} rate USD→KRW 환율
 */
export function formatMoney(usd, currency, rate) {
  if (usd == null || usd === '') return '-';
  const value = Number(usd);
  if (Number.isNaN(value)) return '-';
  if (currency === 'KRW' && rate) {
    return krwFormatter.format(value * rate);
  }
  return usdFormatter.format(value);
}

/** 부호를 붙인 금액. 손익 표시에 쓴다. */
export function formatSignedMoney(usd, currency, rate) {
  if (usd == null) return '-';
  const value = Number(usd);
  const sign = value > 0 ? '+' : '';
  return sign + formatMoney(value, currency, rate);
}

/**
 * 비율(0.0523)을 퍼센트 문자열(+5.23%)로.
 * 백엔드는 퍼센트가 아니라 비율로 주므로 100을 곱한다.
 */
export function formatRate(rate) {
  if (rate == null) return '-';
  const pct = Number(rate) * 100;
  if (Number.isNaN(pct)) return '-';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

/** 이미 퍼센트 단위인 값(시세 API 의 changePercent)용. */
export function formatPercent(pct) {
  if (pct == null) return '-';
  const value = Number(pct);
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** 양수/음수/0 에 따라 색상 클래스를 고른다. */
export function signClass(value) {
  const n = Number(value);
  if (!n) return '';
  return n > 0 ? 'is-up' : 'is-down';
}
