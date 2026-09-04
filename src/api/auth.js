import { apiRequest, clearTokens, setTokens } from './client';

export function sendPhoneCode(phoneNumber) {
  return apiRequest('/api/auth/phone/send-code', {
    method: 'POST',
    body: { phoneNumber },
  });
}

export function verifyPhoneCode(phoneNumber, code) {
  return apiRequest('/api/auth/phone/verify', {
    method: 'POST',
    body: { phoneNumber, code },
  });
}

export function signUp({ username, password, nickname, phoneNumber, email }) {
  return apiRequest('/api/auth/signup', {
    method: 'POST',
    body: {
      username,
      password,
      nickname,
      phoneNumber,
      email: email || undefined,
    },
  });
}

export async function checkUsernameAvailable(username) {
  const params = new URLSearchParams({ username });
  const result = await apiRequest(`/api/auth/check-username?${params}`);
  return result.available;
}

export async function checkNicknameAvailable(nickname) {
  const params = new URLSearchParams({ nickname });
  const result = await apiRequest(`/api/auth/check-nickname?${params}`);
  return result.available;
}

export async function login(username, password) {
  const tokens = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  setTokens(tokens);
  return tokens;
}

export async function logout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST', auth: true });
  } finally {
    clearTokens();
  }
}

export function findId(phoneNumber) {
  return apiRequest('/api/auth/find-id', {
    method: 'POST',
    body: { phoneNumber },
  });
}

export function resetPassword({ username, phoneNumber, newPassword }) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: { username, phoneNumber, newPassword },
  });
}

export async function withdraw(password) {
  await apiRequest('/api/auth/withdraw', {
    method: 'DELETE',
    body: { password },
    auth: true,
  });
  clearTokens();
}
