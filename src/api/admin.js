import { apiRequest } from './client';

/** 운영자 전용. 서버가 ADMIN 권한이 아니면 403 을 준다. */

export function listUsers({ q = '', page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size });
  if (q.trim()) params.set('q', q.trim());
  return apiRequest(`/api/admin/users?${params}`, { auth: true });
}

export function createUser(body) {
  return apiRequest('/api/admin/users', { method: 'POST', body, auth: true });
}

/** 값이 null/undefined 인 항목은 서버가 바꾸지 않는다. */
export function updateUser(id, body) {
  return apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
    auth: true,
  });
}

export function deleteUser(id) {
  return apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  });
}
