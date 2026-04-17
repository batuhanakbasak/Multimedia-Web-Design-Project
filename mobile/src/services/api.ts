import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL, REQUEST_TIMEOUT } from '../constants/api';
import type { AuthPayload } from '../types/auth';
import type { ApiResponse } from '../types/api';
import {
  clearSession as clearStoredSession,
  getStoredTokens,
  saveSession,
} from '../utils/storage';

type AuthHandlers = {
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokensRefreshed?: (payload: AuthPayload) => Promise<void> | void;
  onSessionExpired?: () => Promise<void> | void;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

let authHandlers: AuthHandlers = {};
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const flushRefreshQueue = (error: unknown, token: string | null) => {
  refreshQueue.forEach((entry) => {
    if (error || !token) {
      entry.reject(error);
      return;
    }

    entry.resolve(token);
  });

  refreshQueue = [];
};

const attachAuthorizationHeader = (
  config: InternalAxiosRequestConfig,
  accessToken: string
) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  if (config.headers instanceof AxiosHeaders) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
    return config;
  }

  (config.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  return config;
};

export const configureApiAuthHandlers = (handlers: Partial<AuthHandlers>) => {
  authHandlers = {
    ...authHandlers,
    ...handlers,
  };
};

export const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const tokenFromStore = authHandlers.getAccessToken?.();
  const token =
    tokenFromStore || (await getStoredTokens()).accessToken || undefined;

  if (!token) {
    return config;
  }

  return attachAuthorizationHeader(config, token);
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig;
    const requestPath = originalRequest.url || '';

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh ||
      requestPath.includes('/auth/refresh') ||
      requestPath.includes('/auth/login') ||
      requestPath.includes('/auth/logout')
    ) {
      return Promise.reject(error);
    }

    const refreshTokenFromStore = authHandlers.getRefreshToken?.();
    const refreshToken =
      refreshTokenFromStore || (await getStoredTokens()).refreshToken;

    if (!refreshToken) {
      await authHandlers.onSessionExpired?.();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            attachAuthorizationHeader(originalRequest, token);
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await publicApiClient.post<ApiResponse<AuthPayload>>(
        '/auth/refresh',
        {
          refresh_token: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const refreshedPayload = refreshResponse.data.data;

      if (authHandlers.onTokensRefreshed) {
        await authHandlers.onTokensRefreshed(refreshedPayload);
      } else {
        await saveSession({
          accessToken: refreshedPayload.access_token,
          refreshToken: refreshedPayload.refresh_token,
          user: refreshedPayload.user,
        });
      }

      flushRefreshQueue(null, refreshedPayload.access_token);
      attachAuthorizationHeader(originalRequest, refreshedPayload.access_token);

      return apiClient(originalRequest);
    } catch (refreshError) {
      flushRefreshQueue(refreshError, null);

      if (authHandlers.onSessionExpired) {
        await authHandlers.onSessionExpired();
      } else {
        await clearStoredSession();
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
