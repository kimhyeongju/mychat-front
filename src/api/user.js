import { apiRequest } from './client';

export function searchUsers(keyword) {
  const params = new URLSearchParams({ keyword });
  return apiRequest(`/api/users/search?${params}`, { auth: true });
}
