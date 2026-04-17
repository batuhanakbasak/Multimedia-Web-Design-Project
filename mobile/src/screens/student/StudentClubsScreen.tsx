import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ClubCard } from '../../components/club/ClubCard';
import { STUDENT_STACK_ROUTES, type StudentStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import { getStudentClubs } from '../../services/student.service';
import type { ClubItem } from '../../types/club';
import { handleApiError } from '../../utils/errorHandler';

export const StudentClubsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadClubs = useCallback(async (isRefresh = false) => {
    try {
      setErrorMessage('');
      isRefresh ? setRefreshing(true) : setLoading(true);
      const response = await getStudentClubs();
      setClubs(response);
    } catch (error) {
      setErrorMessage(handleApiError(error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadClubs();
  }, [loadClubs]);

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadClubs(true)}
          tintColor={theme.colors.primary}
        />
      }
    >
      <AppHeader
        title="Clubs"
        subtitle="Explore active clubs, managers, and upcoming activities."
        onBackPress={() => navigation.goBack()}
      />

      {loading ? <LoadingView variant="cards" /> : null}
      {errorMessage ? <ErrorView message={errorMessage} onRetry={() => loadClubs()} /> : null}
      {!loading && !errorMessage && !clubs.length ? (
        <EmptyState title="No clubs found" message="Active clubs will appear here." />
      ) : null}

      <View style={styles.list}>
        {clubs.map((club) => (
          <ClubCard
            key={club.id}
            club={club}
            onPress={() =>
              navigation.navigate(STUDENT_STACK_ROUTES.ClubDetail, {
                clubId: club.id,
              })
            }
          />
        ))}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.lg,
  },
});
