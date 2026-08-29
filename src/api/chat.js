import { apiRequest, getAccessToken } from './client';

export function findNearbyRooms(latitude, longitude) {
  const params = new URLSearchParams({ latitude, longitude });
  return apiRequest(`/api/chat/rooms/nearby?${params}`, {
    auth: Boolean(getAccessToken()),
  });
}

export function createLocationRoom({ latitude, longitude, radiusMeters }) {
  return apiRequest('/api/chat/rooms/location', {
    method: 'POST',
    body: { latitude, longitude, radiusMeters },
    auth: Boolean(getAccessToken()),
  });
}

export function joinRoom(roomId) {
  return apiRequest(`/api/chat/rooms/${roomId}/join`, {
    method: 'POST',
    auth: Boolean(getAccessToken()),
  });
}

/** 회원 전용: 상대방과의 DM 방을 가져오거나 새로 만든다. */
export function getOrCreateDirectRoom(targetUserId) {
  return apiRequest(`/api/chat/rooms/direct/${targetUserId}`, {
    method: 'POST',
    auth: true,
  });
}

export function getMessages(roomId, { page = 0, size = 30 } = {}) {
  const params = new URLSearchParams({ page, size });
  return apiRequest(`/api/chat/rooms/${roomId}/messages?${params}`, {
    auth: Boolean(getAccessToken()),
  });
}

/** 로그인한 내 DM 방 목록 (인증 필수) */
export function listDirectRooms() {
  return apiRequest('/api/chat/rooms/direct', { auth: true });
}
