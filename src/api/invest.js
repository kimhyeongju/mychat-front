import { apiRequest } from './client';

// ---------- 공개 ----------

export function searchSymbols(query) {
  const params = new URLSearchParams({ q: query });
  return apiRequest(`/api/invest/symbols/search?${params}`);
}

export function getQuote(symbol) {
  return apiRequest(`/api/invest/symbols/${encodeURIComponent(symbol)}`);
}

export function getFx() {
  return apiRequest('/api/invest/fx');
}

/** 비로그인도 호출 가능. 토큰이 있으면 내 순위(me)가 함께 온다. */
export function getRanking() {
  return apiRequest('/api/invest/ranking', { auth: true });
}

// ---------- 회원 ----------

export function getAccount() {
  return apiRequest('/api/invest/account', { auth: true });
}

export function getPortfolio() {
  return apiRequest('/api/invest/portfolio', { auth: true });
}

export function getTrades({ page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size });
  return apiRequest(`/api/invest/trades?${params}`, { auth: true });
}

/**
 * @param {'BUY'|'SELL'} side
 */
export function placeTrade({ symbol, side, quantity }) {
  return apiRequest('/api/invest/trades', {
    method: 'POST',
    body: { symbol, side, quantity },
    auth: true,
  });
}

/** 다른 사용자의 포트폴리오(종목 비중만). 로그인 필요. */
export function getUserPortfolio(userId) {
  return apiRequest(`/api/invest/users/${encodeURIComponent(userId)}/portfolio`, {
    auth: true,
  });
}
