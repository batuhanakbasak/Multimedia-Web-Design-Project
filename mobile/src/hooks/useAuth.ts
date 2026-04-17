import { useMemo } from 'react';

import { useAuthStore } from '../store/auth.store';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const logout = useAuthStore((state) => state.logout);
  const loginSuccess = useAuthStore((state) => state.loginSuccess);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMemo(
    () => ({
      user,
      role,
      isLoading,
      isAuthenticated,
      isStudent: role === 'student',
      isOrganizer: role === 'organizer',
      restoreSession,
      logout,
      loginSuccess,
      setUser,
      setTokens,
    }),
    [
      isAuthenticated,
      isLoading,
      loginSuccess,
      logout,
      restoreSession,
      role,
      setTokens,
      setUser,
      user,
    ]
  );
};
