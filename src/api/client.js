const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const ACCESS_TOKEN_KEY = 'playground_access_token';
const REFRESH_TOKEN_KEY = 'playground_refresh_token';
const LANGUAGE_KEY = 'playground_lang';

/** 서버가 오류 문구를 이 언어로 내려준다(ko, en). 기본은 한국어. */
export function getLanguage() {
  return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'ko';
}

export function setLanguage(lang) {
  localStorage.setItem(LANGUAGE_KEY, lang === 'en' ? 'en' : 'ko');
}

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

/**
 * @param {string} message - 사용자에게 보여줄 문구
 * @param {number} status - HTTP 상태. 서버에 닿지 못했으면 0
 * @param {string} [code] - 서버의 오류 코드(exception_*.yml 의 code)
 * @param {{field: string, message: string}[]} [fieldErrors] - 입력 검증 실패 사유
 */
export class ApiError extends Error {
  constructor(message, status, code, fieldErrors = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

const NETWORK_ERROR = {
  ko: '서버에 연결할 수 없습니다. 네트워크를 확인하고 잠시 후 다시 시도해주세요.',
  en: 'Cannot connect to the server. Check your network and try again.',
};

// 서버가 본문을 주지 못한 경우(프록시 오류 등)에 쓰는 상태별 기본 문구.
const STATUS_FALLBACK = {
  ko: {
    401: '로그인이 필요하거나 로그인이 만료되었습니다. 다시 로그인해주세요.',
    403: '권한이 없습니다.',
    404: '요청한 대상을 찾을 수 없습니다.',
    413: '파일 크기가 너무 큽니다.',
    429: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    default: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
    server: '서버에 문제가 생겼습니다. 잠시 후 다시 시도해주세요.',
  },
  en: {
    401: 'Login is required, or your session has expired. Please log in again.',
    403: 'You do not have permission.',
    404: 'The requested resource was not found.',
    413: 'The file is too large.',
    429: 'Too many requests. Please try again later.',
    default: 'The request could not be processed. Please try again later.',
    server: 'Something went wrong on the server. Please try again later.',
  },
};

function fallbackMessage(status) {
  const table = STATUS_FALLBACK[getLanguage()];
  if (table[status]) return table[status];
  return status >= 500 ? table.server : table.default;
}

/** 로그인이 풀렸음을 앱에 알린다. AuthContext 가 듣고 로그아웃 상태로 바꾼다. */
function notifyAuthExpired() {
  clearTokens();
  window.dispatchEvent(new Event('auth:expired'));
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
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': getLanguage(),
        },
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

function buildRequest(
  path,
  { method, body, auth, isFormData, extraHeaders },
) {
  const headers = { 'Accept-Language': getLanguage(), ...extraHeaders };

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
  let message = fallbackMessage(response.status);
  let code;
  let fieldErrors = [];
  try {
    // 서버 오류 본문: { code, message, status, fieldErrors }
    const data = await response.json();
    message = data.message || message;
    code = data.code;
    fieldErrors = Array.isArray(data.fieldErrors) ? data.fieldErrors : [];
  } catch {
    // 응답이 JSON이 아닌 경우 상태별 기본 문구를 쓴다.
  }
  return new ApiError(message, response.status, code, fieldErrors);
}

/** fetch 자체가 실패하면(서버 다운, 네트워크 끊김) 상태가 없으므로 별도 오류로 바꾼다. */
async function safeFetch(url, init) {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError(NETWORK_ERROR[getLanguage()], 0);
  }
}

/**
 * @param {string} path - "/api/auth/login" 같은 경로
 * @param {object} options
 * @param {string} options.method - HTTP 메서드
 * @param {object|FormData} options.body - 객체면 JSON 직렬화, FormData면 그대로 전송
 * @param {object} options.headers - 추가로 실을 헤더 (예: X-Anonymous-Id)
 * @param {boolean} options.auth - true면 Authorization 헤더를 싣고, 401 시 토큰 재발급 후 1회 재시도
 */
export async function apiRequest(
  path,
  { method = 'GET', body, auth = false, headers: extraHeaders } = {},
) {
  const isFormData = body instanceof FormData;
  const url = `${API_BASE_URL}${path}`;

  let response = await safeFetch(
    url,
    buildRequest(path, { method, body, auth, isFormData, extraHeaders }),
  );

  // access token 만료로 보이면 한 번만 재발급 후 재시도한다.
  if (response.status === 401 && auth && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await safeFetch(
        url,
        buildRequest(path, { method, body, auth, isFormData, extraHeaders }),
      );
    }
  }

  // 로그인이 필요한 요청인데 재발급까지 실패했다면 로그인이 풀린 것이다.
  // 로그인 화면의 잘못된 비밀번호(auth: false)와는 구분된다.
  if (response.status === 401 && auth) {
    notifyAuthExpired();
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
  const response = await safeFetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Accept-Language': getLanguage(),
      ...(getAccessToken()
        ? { Authorization: `Bearer ${getAccessToken()}` }
        : {}),
    },
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
