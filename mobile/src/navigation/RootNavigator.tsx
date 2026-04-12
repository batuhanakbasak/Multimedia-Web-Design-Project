import { useEffect } from 'react';

import { AuthNavigator } from './AuthNavigator';
import { OrganizerNavigator } from './OrganizerNavigator';
import { StudentNavigator } from './StudentNavigator';

import { SplashScreen } from '../screens/auth/SplashScreen';
import { useAuth } from '../hooks/useAuth';

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, restoreSession, role } = useAuth();

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (role === 'student') {
    return <StudentNavigator />;
  }

  if (role === 'organizer') {
    return <OrganizerNavigator />;
  }

  return <AuthNavigator />;
};
