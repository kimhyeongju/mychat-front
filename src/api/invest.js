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

// ---------- 주간 대회 (공개) ----------

/** 이번 주 마감(정산) 시각, 규칙, 지난주 결과 */
export function getWeekInfo() {
  return apiRequest('/api/invest/week');
}

/** 누적 포인트 순위 */
export function getLeaderboard() {
  return apiRequest('/api/invest/leaderboard');
}

/** 사용자 프로필: 누적 포인트, 1·2·3위 횟수, 최근 성적 */
export function getProfile(userId) {
  return apiRequest(`/api/invest/users/${encodeURIComponent(userId)}/profile`);
}

// ---------- 관심 종목 (로그인) ----------

export function getWatchlist() {
  return apiRequest('/api/invest/watchlist', { auth: true });
}

export function addWatch(symbol) {
  return apiRequest(`/api/invest/watchlist/${encodeURIComponent(symbol)}`, {
    method: 'PUT',
    auth: true,
  });
}

export function removeWatch(symbol) {
  return apiRequest(`/api/invest/watchlist/${encodeURIComponent(symbol)}`, {
    method: 'DELETE',
    auth: true,
  });
}

/** 이번 주에 내 보유 종목에 적용된 분할/병합 조정 내역. */
export function getSplitAdjustments() {
  return apiRequest('/api/invest/split-adjustments', { auth: true });
}

// ---------- 종목 뉴스 / 토론 ----------

/** 비로그인도 호출 가능. 최신순 최대 15건. */
export function getStockNews(symbol) {
  return apiRequest(`/api/invest/symbols/${encodeURIComponent(symbol)}/news`);
}

/**
 * 토론 글 목록. 비로그인도 호출 가능하고, 토큰이 있으면 liked/mine 이 채워진다.
 * @param {'latest'|'popular'} sort
 */
export function getStockPosts(symbol, { sort = 'latest', page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ sort, page, size });
  return apiRequest(
    `/api/invest/symbols/${encodeURIComponent(symbol)}/posts?${params}`,
    { auth: true },
  );
}

export function createStockPost(symbol, content) {
  return apiRequest(`/api/invest/symbols/${encodeURIComponent(symbol)}/posts`, {
    method: 'POST',
    body: { content },
    auth: true,
  });
}

export function updateStockPost(postId, content) {
  return apiRequest(`/api/invest/posts/${postId}`, {
    method: 'PATCH',
    body: { content },
    auth: true,
  });
}

export function deleteStockPost(postId) {
  return apiRequest(`/api/invest/posts/${postId}`, {
    method: 'DELETE',
    auth: true,
  });
}

/** @returns {Promise<{likeCount: number, liked: boolean}>} */
export function setPostLike(postId, liked) {
  return apiRequest(`/api/invest/posts/${postId}/like`, {
    method: liked ? 'PUT' : 'DELETE',
    auth: true,
  });
}

export function getPostComments(postId) {
  return apiRequest(`/api/invest/posts/${postId}/comments`, { auth: true });
}

export function createPostComment(postId, content) {
  return apiRequest(`/api/invest/posts/${postId}/comments`, {
    method: 'POST',
    body: { content },
    auth: true,
  });
}

export function deletePostComment(commentId) {
  return apiRequest(`/api/invest/comments/${commentId}`, {
    method: 'DELETE',
    auth: true,
  });
}

// ---------- 자동 매수 (로그인) ----------

/** 내 자동 매수 현황: { rules, totalPercent, remainingPercent, history } */
export function getAutoBuys() {
  return apiRequest('/api/invest/auto-buys', { auth: true });
}

/** 항상 월요일에 실행된다. 응답은 getAutoBuys 와 같은 현황이다. */
export function createAutoBuy({ symbol, percent }) {
  return apiRequest('/api/invest/auto-buys', {
    method: 'POST',
    body: { symbol, percent },
    auth: true,
  });
}

export function deleteAutoBuy(id) {
  return apiRequest(`/api/invest/auto-buys/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}
