const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');
const getCurrentOriginLabel = () =>
  window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : 'file://';

const resolveApiBaseUrl = () => {
  const runtimeConfigUrl = window.ADMIN_APP_CONFIG?.apiBaseUrl;

  if (runtimeConfigUrl && normalizeBaseUrl(runtimeConfigUrl)) {
    return normalizeBaseUrl(runtimeConfigUrl);
  }

  const metaConfigUrl = document
    .querySelector('meta[name="admin-api-base-url"]')
    ?.getAttribute('content');

  if (metaConfigUrl && normalizeBaseUrl(metaConfigUrl)) {
    return normalizeBaseUrl(metaConfigUrl);
  }

  const { protocol, hostname, origin } = window.location;
  const isHttpPage = protocol === 'http:' || protocol === 'https:';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isHttpPage && !isLocalhost) {
    return `${origin}/api`;
  }

  return 'http://94.55.180.77:3000/api';
};

export const API_BASE_URL = resolveApiBaseUrl();
export const ADMIN_TOKEN_KEY = 'admin_token';

export const serializeQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const extractErrorMessage = (payload, fallbackMessage = 'Something went wrong') => {
  if (!payload) {
    return fallbackMessage;
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors.map((error) => error.message).join(', ');
  }

  return payload.message || fallbackMessage;
};

export const apiRequest = async (path, options = {}) => {
  const { auth = true, method = 'GET', body, headers = {} } = options;
  const requestHeaders = { ...headers };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const currentOrigin = getCurrentOriginLabel();
    const isFileOrigin = currentOrigin === 'file://';
    const hint = isFileOrigin
      ? 'Open the frontend through a local static server such as http://localhost:5500/login.html.'
      : `Allow ${currentOrigin} in backend CORS settings and confirm that ${API_BASE_URL} is reachable.`;

    const requestError = new Error(`Unable to reach the admin API. ${hint}`);
    requestError.status = 0;
    requestError.code = 'NETWORK_ERROR';
    requestError.payload = null;
    throw requestError;
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const requestError = new Error(
      extractErrorMessage(payload, `Request failed with status ${response.status}`)
    );

    requestError.status = response.status;
    requestError.payload = payload;
    throw requestError;
  }

  return payload;
};
