import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { SectionHeader } from '../../components/common/SectionHeader';
import { StatCard } from '../../components/common/StatCard';
import { EventCard } from '../../components/event/EventCard';
import {
  STUDENT_STACK_ROUTES,
  STUDENT_TAB_ROUTES,
  type StudentStackParamList,
} from '../../constants/routes';
import { theme } from '../../constants/theme';
import { getStudentDashboard } from '../../services/student.service';
import { useAuthStore } from '../../store/auth.store';
import type { StudentDashboard } from '../../types/dashboard';
import type { EventItem } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';

const toEventItem = (preview: StudentDashboard['recommended_events'][number]): EventItem => ({
  id: preview.id,
  club_id: null,
  organizer_id: 0,
  title: preview.title,
  description: 'Open the event card to view full details.',
  category: preview.category,
  event_date: preview.event_date,
  location: preview.location,
  image_url: null,
  quota: 0,
  status: preview.status,
  timeline_status: (preview.status as EventItem['timeline_status']) ?? 'active',
});

export const StudentHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      setErrorMessage('');
      isRefresh ? setRefreshing(true) : setLoading(true);
      const response = await getStudentDashboard();
      setData(response);
    } catch (error) {
      setErrorMessage(handleApiError(error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const greetingName = useMemo(
    () => user?.full_name?.split(' ')[0] || 'Student',
    [user?.full_name]
  );

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingView message="Preparing your student dashboard..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDashboard(true)}
          tintColor={theme.colors.primary}
        />
      }
    >
      <AppHeader
        title={`Hello, ${greetingName}`}
        subtitle="Take a quick look at what is happening on campus today."
      />

      <View style={styles.heroCard}>
        <PrimaryButton
          title="Explore Events"
          onPress={() =>
            navigation.navigate(STUDENT_STACK_ROUTES.Tabs, {
              screen: STUDENT_TAB_ROUTES.Explore,
            })
          }
        />
        <SecondaryButton
          title="My Events"
          onPress={() =>
            navigation.navigate(STUDENT_STACK_ROUTES.Tabs, {
              screen: STUDENT_TAB_ROUTES.MyEvents,
            })
          }
        />
        <SecondaryButton
          title="View Clubs"
          onPress={() => navigation.navigate(STUDENT_STACK_ROUTES.Clubs)}
        />
      </View>

      {errorMessage ? <ErrorView message={errorMessage} onRetry={() => loadDashboard()} /> : null}

      {data ? (
        <>
          <View style={styles.statGrid}>
            <StatCard label="Joined" value={data.joined_events_count} />
            <StatCard label="Favorites" value={data.favorite_count} tone="accent" />
            <StatCard label="Upcoming" value={data.upcoming_joined_events.length} tone="neutral" />
          </View>

          <SectionHeader title="Upcoming Registrations" subtitle="The first events currently on your calendar" />
          {data.upcoming_joined_events.length ? (
            <View style={styles.list}>
              {data.upcoming_joined_events.map((event) => (
                <EventCard
                  key={event.id}
                  compact
                  event={toEventItem(event)}
                  onPress={() =>
                    navigation.navigate(STUDENT_STACK_ROUTES.EventDetail, {
                      eventId: event.id,
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyState
              title="You have not joined any events yet"
              message="This section will fill up after you join events from the Explore tab."
            />
          )}

          <SectionHeader title="Recommended Events" subtitle="Campus picks curated for you" />
          {data.recommended_events.length ? (
            <View style={styles.list}>
              {data.recommended_events.map((event) => (
                <EventCard
                  key={event.id}
                  compact
                  event={toEventItem(event)}
                  onPress={() =>
                    navigation.navigate(STUDENT_STACK_ROUTES.EventDetail, {
                      eventId: event.id,
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyState
              title="No recommendations yet"
              message="When new events are published, recommendations for you will appear here."
            />
          )}
        </>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.lg,
  },
});
