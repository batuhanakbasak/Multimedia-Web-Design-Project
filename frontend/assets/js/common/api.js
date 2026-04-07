import { clearStudentSession, getStudentToken, redirectToStudentLogin } from './auth.js';

const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const getCurrentOriginLabel = () =>
  window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'file://';

const resolveApiBaseUrl = () => {
  const runtimeConfigUrl = window.STUDENT_APP_CONFIG?.apiBaseUrl;

  if (runtimeConfigUrl && normalizeBaseUrl(runtimeConfigUrl)) {
    return normalizeBaseUrl(runtimeConfigUrl);
  }

  const metaConfigUrl = document
    .querySelector('meta[name="student-api-base-url"]')
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

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const createRequestError = (message, status = 0, payload = null) => {
  const error = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
};

const handleAuthorizationFailure = (status) => {
  if (status !== 401 && status !== 403) {
    return false;
  }

  clearStudentSession();
  redirectToStudentLogin(status === 403 ? 'forbidden' : 'session');
  return true;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const serializeQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
};

export const getValidationMessages = (payload) => {
  if (!payload || !Array.isArray(payload.errors)) {
    return [];
  }

  return payload.errors
    .map((error) => error?.message)
    .filter(Boolean);
};

export const extractErrorMessage = (payload, fallbackMessage = 'Something went wrong') => {
  const validationMessages = getValidationMessages(payload);

  if (validationMessages.length > 0) {
    return validationMessages.join(', ');
  }

  return payload?.message || fallbackMessage;
};

export const apiRequest = async (path, options = {}) => {
  const {
    method = 'GET',
    auth = true,
    query,
    body,
    headers = {},
  } = options;
  const requestHeaders = { ...headers };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getStudentToken();

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const queryString = query ? serializeQuery(query) : '';
  const requestUrl = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;

  let response;

  try {
    response = await fetch(requestUrl, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const currentOrigin = getCurrentOriginLabel();
    const hint =
      currentOrigin === 'file://'
        ? 'Open the frontend through a local static server instead of double-clicking the HTML file.'
        : `Make sure ${currentOrigin} is allowed by CORS and that ${API_BASE_URL} is reachable.`;

    throw createRequestError(`Unable to reach the student API. ${hint}`, 0, null);
  }

  const payload = await parseJsonSafely(response);

  if (!response.ok || payload?.success === false) {
    if (auth && handleAuthorizationFailure(response.status)) {
      throw createRequestError(
        extractErrorMessage(payload, 'Your session expired. Please sign in again.'),
        response.status,
        payload
      );
    }

    throw createRequestError(
      extractErrorMessage(payload, `Request failed with status ${response.status}`),
      response.status,
      payload
    );
  }

  return payload;
};
