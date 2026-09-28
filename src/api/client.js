const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const ACCESS_TOKEN_KEY = 'playground_access_token';
const REFRESH_TOKEN_KEY = 'playground_refresh_token';

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

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * 동시에 여러 요청이 401을 받아도 재발급은 한 번만 하도록 진행 중인 요청을 공유한다.
 */
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reissue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        return false;
      }

      setTokens(await response.json());
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function buildRequest(path, { method, body, auth, isFormData }) {
  const headers = {};

  // FormData는 브라우저가 boundary를 포함한 Content-Type을 직접 정해야 하므로
  // 여기서 지정하면 업로드가 깨진다.
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  return {
    method,
    headers,
    body: isFormData
      ? body
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  };
}

async function parseError(response) {
  let message = `요청에 실패했습니다. (${response.status})`;
  try {
    const data = await response.json();
    message = data.message || data.error || message;
  } catch {
    // 응답이 JSON이 아닌 경우 기본 메시지 사용
  }
  return new ApiError(message, response.status);
}

/**
 * @param {string} path - "/api/auth/login" 같은 경로
 * @param {object} options
 * @param {string} options.method - HTTP 메서드
 * @param {object|FormData} options.body - 객체면 JSON 직렬화, FormData면 그대로 전송
 * @param {boolean} options.auth - true면 Authorization 헤더를 싣고, 401 시 토큰 재발급 후 1회 재시도
 */
export async function apiRequest(
  path,
  { method = 'GET', body, auth = false } = {},
) {
  const isFormData = body instanceof FormData;
  const url = `${API_BASE_URL}${path}`;

  let response = await fetch(
    url,
    buildRequest(path, { method, body, auth, isFormData }),
  );

  // access token 만료로 보이면 한 번만 재발급 후 재시도한다.
  if (response.status === 401 && auth && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(
        url,
        buildRequest(path, { method, body, auth, isFormData }),
      );
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (
    response.status === 204 ||
    response.headers.get('content-length') === '0'
  ) {
    return null;
  }

  return response.json();
}

/**
 * 파일 다운로드용. JSON이 아니라 Blob을 받는다.
 */
export async function apiDownload(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: getAccessToken()
      ? { Authorization: `Bearer ${getAccessToken()}` }
      : {},
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  // Content-Disposition에서 원본 파일명을 꺼낸다. 서버가 RFC 5987로 인코딩해 보낸다.
  const disposition = response.headers.get('content-disposition') ?? '';
  const match = disposition.match(/filename\*=UTF-8''(.+)$/);
  const filename = match ? decodeURIComponent(match[1]) : 'download';

  return { blob: await response.blob(), filename };
}
