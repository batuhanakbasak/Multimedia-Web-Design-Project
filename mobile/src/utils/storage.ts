import * as SecureStore from 'expo-secure-store';

import { STORAGE_KEYS } from '../constants/api';
import type { User } from '../types/user';

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}

const normalizeSecureStoreKey = (key: string) => {
  const normalized = key.trim().replace(/[^A-Za-z0-9._-]/g, '_');

  if (!normalized) {
    throw new Error('SecureStore key cannot be empty.');
  }

  return normalized;
};

const setSecureItem = async (key: string, value: string) => {
  await SecureStore.setItemAsync(normalizeSecureStoreKey(key), value);
};

const getSecureItem = async (key: string) => {
  return SecureStore.getItemAsync(normalizeSecureStoreKey(key));
};

const deleteSecureItem = async (key: string) => {
  await SecureStore.deleteItemAsync(normalizeSecureStoreKey(key));
};

const safeJsonParse = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (_error) {
    return null;
  }
};

export const saveAccessToken = async (token: string) => {
  await setSecureItem(STORAGE_KEYS.accessToken, token);
};

export const saveRefreshToken = async (token: string) => {
  await setSecureItem(STORAGE_KEYS.refreshToken, token);
};

export const saveUser = async (user: User) => {
  await setSecureItem(STORAGE_KEYS.user, JSON.stringify(user));
};

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await Promise.all([saveAccessToken(accessToken), saveRefreshToken(refreshToken)]);
};

export const getStoredTokens = async () => {
  const [accessToken, refreshToken] = await Promise.all([
    getSecureItem(STORAGE_KEYS.accessToken),
    getSecureItem(STORAGE_KEYS.refreshToken),
  ]);

  return {
    accessToken,
    refreshToken,
  };
};

export const getStoredUser = async () => {
  const storedUser = await getSecureItem(STORAGE_KEYS.user);
  return safeJsonParse<User>(storedUser);
};

export const saveSession = async (session: {
  accessToken: string;
  refreshToken: string;
  user: User;
}) => {
  await Promise.all([
    saveAccessToken(session.accessToken),
    saveRefreshToken(session.refreshToken),
    saveUser(session.user),
  ]);
};

export const loadSession = async (): Promise<StoredSession> => {
  const [tokens, user] = await Promise.all([getStoredTokens(), getStoredUser()]);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user,
  };
};

export const clearStoredTokens = async () => {
  await Promise.all([
    deleteSecureItem(STORAGE_KEYS.accessToken),
    deleteSecureItem(STORAGE_KEYS.refreshToken),
  ]);
};

export const clearSession = async () => {
  await Promise.all([
    deleteSecureItem(STORAGE_KEYS.accessToken),
    deleteSecureItem(STORAGE_KEYS.refreshToken),
    deleteSecureItem(STORAGE_KEYS.user),
  ]);
};
