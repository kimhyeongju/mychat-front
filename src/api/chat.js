import { apiRequest } from './client';

const ANONYMOUS_KEY = 'playground_anonymous_id';

// ---------- 익명 세션 ----------

export function getStoredAnonymousId() {
  return localStorage.getItem(ANONYMOUS_KEY);
}

/**
 * 익명 신원을 확보한다. 이미 발급받은 게 있으면 재사용한다.
 * 이 토큰은 권한이 전혀 없고, 같은 사람이 보낸 메시지를 묶는 용도로만 쓰인다.
 */
export async function ensureAnonymousSession() {
  const stored = getStoredAnonymousId();
  if (stored) return stored;

  const session = await apiRequest('/api/chat/anonymous-session', {
    method: 'POST',
  });
  localStorage.setItem(ANONYMOUS_KEY, session.anonymousId);
  return session.anonymousId;
}

export function clearAnonymousSession() {
  localStorage.removeItem(ANONYMOUS_KEY);
}

// ---------- 오픈 채팅 ----------

export function getOpenRooms() {
  return apiRequest('/api/chat/rooms/open');
}

export function getOpenRoom(roomId) {
  return apiRequest(`/api/chat/rooms/open/${roomId}`);
}

export function getOpenMessages(roomId, cursor) {
  const query = cursor ? `?cursor=${cursor}` : '';
  return apiRequest(`/api/chat/rooms/open/${roomId}/messages${query}`);
}

// ---------- DM ----------

export function getDirectRooms() {
  return apiRequest('/api/chat/dm/rooms', { auth: true });
}

export function startDirect(targetUserId) {
  return apiRequest('/api/chat/dm/rooms', {
    method: 'POST',
    body: { targetUserId },
    auth: true,
  });
}

export function getDirectMessages(roomId, cursor) {
  const query = cursor ? `?cursor=${cursor}` : '';
  return apiRequest(`/api/chat/dm/rooms/${roomId}/messages${query}`, {
    auth: true,
  });
}

export function markDirectRead(roomId) {
  return apiRequest(`/api/chat/dm/rooms/${roomId}/read`, {
    method: 'POST',
    auth: true,
  });
}

export function hideDirectRoom(roomId) {
  return apiRequest(`/api/chat/dm/rooms/${roomId}`, {
    method: 'DELETE',
    auth: true,
  });
}
