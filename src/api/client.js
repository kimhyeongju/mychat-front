const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const ACCESS_TOKEN_KEY = 'mychat_access_token';
const REFRESH_TOKEN_KEY = 'mychat_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * @param {string} path - "/api/auth/login" 같은 경로
 * @param {object} options - fetch 옵션. body는 객체로 넘기면 자동으로 JSON.stringify 처리.
 * @param {boolean} auth - true면 Authorization 헤더에 accessToken을 실어 보냄
 */
export async function apiRequest(
  path,
  { method = 'GET', body, auth = false } = {},
) {
  const headers = {
    'Content-Type': 'application/json',
    // ngrok 무료 플랜이 API 요청에도 끼워 넣는 경고 인터스티셜을 건너뛰기 위한 헤더.
    // ngrok을 안 쓰는 환경(localhost, 배포 등)에서는 서버가 그냥 무시하므로 항상 붙여도 무해하다.
    'ngrok-skip-browser-warning': 'true',
  };

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `요청에 실패했습니다. (${response.status})`;
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {
      // 응답이 JSON이 아닌 경우 기본 메시지 사용
    }
    throw new ApiError(message, response.status);
  }

  if (
    response.status === 204 ||
    response.headers.get('content-length') === '0'
  ) {
    return null;
  }

  return response.json();
}
