import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../../components/common/AppHeader';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ORGANIZER_STACK_ROUTES, type OrganizerStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import { getOrganizerProfile } from '../../services/organizer.service';
import { useAuthStore } from '../../store/auth.store';
import type { User } from '../../types/user';
import { handleApiError } from '../../utils/errorHandler';

export const OrganizerProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OrganizerStackParamList>>();
  const logout = useAuthStore((state) => state.logout);
  const storedUser = useAuthStore((state) => state.user);

  const [profile, setProfile] = useState<User | null>(storedUser);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProfile = useCallback(async (isRefresh = false) => {
    try {
      setErrorMessage('');
      isRefresh ? setRefreshing(true) : setLoading(true);
      const response = await getOrganizerProfile();
      setProfile(response);
    } catch (error) {
      setErrorMessage(handleApiError(error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (loading && !profile) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingView message="Loading organizer profile..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadProfile(true)}
          tintColor={theme.colors.primary}
        />
      }
    >
      <AppHeader title="Organizer Profile" subtitle="Manage your account and session." />

      {profile ? <ProfileHeader user={profile} /> : null}
      {errorMessage ? <ErrorView message={errorMessage} onRetry={() => loadProfile()} /> : null}

      <View style={styles.actions}>
        <PrimaryButton
          title="Edit Profile"
          onPress={() => navigation.navigate(ORGANIZER_STACK_ROUTES.EditProfile)}
        />
        <SecondaryButton
          title="Change Password"
          onPress={() => navigation.navigate(ORGANIZER_STACK_ROUTES.ChangePassword)}
        />
        <SecondaryButton title="Sign Out" onPress={() => void logout()} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  actions: {
    gap: theme.spacing.md,
  },
});
