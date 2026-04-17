import { create } from 'zustand';

import { getCurrentUser, logoutRequest } from '../services/auth.service';
import { configureApiAuthHandlers } from '../services/api';
import type { AuthPayload } from '../types/auth';
import type { UserRole, User } from '../types/user';
import {
  clearSession as clearStoredSession,
  clearStoredTokens,
  getStoredTokens,
  loadSession,
  saveSession,
  saveTokens,
  saveUser,
} from '../utils/storage';

import { useUserStore } from './user.store';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  loginSuccess: (payload: AuthPayload) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
  setTokens: (accessToken: string | null, refreshToken: string | null) => Promise<void>;
  clearSession: () => Promise<void>;
}

const syncUserState = async (set: (partial: Partial<AuthState>) => void, user: User | null, accessToken: string | null) => {
  set({
    user,
    role: user?.role ?? null,
    isAuthenticated: Boolean(user && accessToken),
  });

  if (user) {
    await saveUser(user);
    useUserStore.getState().setProfile(user);
    return;
  }

  useUserStore.getState().setProfile(null);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  role: null,
  loginSuccess: async (payload) => {
    set({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      user: payload.user,
      role: payload.user.role,
      isAuthenticated: true,
      isLoading: false,
    });

    useUserStore.getState().setProfile(payload.user);
    await saveSession({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      user: payload.user,
    });
  },
  restoreSession: async () => {
    set({ isLoading: true });

    try {
      const session = await loadSession();

      if (!session.accessToken || !session.refreshToken) {
        await get().clearSession();
        return;
      }

      set({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
        role: session.user?.role ?? null,
        isAuthenticated: Boolean(session.user && session.accessToken),
      });

      if (session.user) {
        useUserStore.getState().setProfile(session.user);
      }

      const currentUser = await getCurrentUser();

      set({
        user: currentUser,
        role: currentUser.role,
        isAuthenticated: true,
      });

      useUserStore.getState().setProfile(currentUser);
      await saveUser(currentUser);
    } catch (_error) {
      await get().clearSession();
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async () => {
    try {
      const refreshToken =
        get().refreshToken || (await getStoredTokens()).refreshToken;

      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } catch (_error) {
      // Best-effort logout. We still clear the local session below.
    } finally {
      await get().clearSession();
    }
  },
  setUser: async (user) => {
    await syncUserState(set, user, get().accessToken);
  },
  setTokens: async (accessToken, refreshToken) => {
    set({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken && get().user),
    });

    if (accessToken && refreshToken) {
      await saveTokens(accessToken, refreshToken);
      return;
    }

    await clearStoredTokens();
  },
  clearSession: async () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,
      isLoading: false,
    });

    useUserStore.getState().reset();
    await clearStoredSession();
  },
}));

configureApiAuthHandlers({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokensRefreshed: async (payload) => {
    await useAuthStore.getState().loginSuccess(payload);
  },
  onSessionExpired: async () => {
    await useAuthStore.getState().clearSession();
  },
});
