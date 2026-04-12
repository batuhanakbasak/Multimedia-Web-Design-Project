import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SectionHeader } from '../../components/common/SectionHeader';
import { StatCard } from '../../components/common/StatCard';
import { EventCard } from '../../components/event/EventCard';
import { ORGANIZER_STACK_ROUTES, type OrganizerStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import { getOrganizerDashboard } from '../../services/organizer.service';
import type { OrganizerDashboard } from '../../types/dashboard';
import type { EventItem } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';

const toDashboardEvent = (event: OrganizerDashboard['upcoming_events'][number]): EventItem => ({
  ...event,
  club_id: event.club_id ?? null,
  organizer_id: event.organizer_id ?? 0,
  description: event.description || 'Upcoming organizer event',
  image_url: event.image_url ?? null,
  quota: event.quota ?? 0,
});

export const OrganizerDashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OrganizerStackParamList>>();
  const [dashboard, setDashboard] = useState<OrganizerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      setErrorMessage('');
      isRefresh ? setRefreshing(true) : setLoading(true);
      const response = await getOrganizerDashboard();
      setDashboard(response);
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
        title="Organizer Dashboard"
        subtitle="Your stats and upcoming events in one place."
      />

      <PrimaryButton
        title="Create New Event"
        onPress={() =>
          navigation.navigate(ORGANIZER_STACK_ROUTES.Tabs, {
            screen: 'OrganizerCreateEventTab',
          })
        }
      />

      {loading ? <LoadingView variant="cards" /> : null}
      {errorMessage ? <ErrorView message={errorMessage} onRetry={() => loadDashboard()} /> : null}

      {dashboard ? (
        <>
          <View style={styles.statGrid}>
            <StatCard label="Total Events" value={dashboard.total_events} />
            <StatCard label="Active" value={dashboard.active_events} tone="accent" />
            <StatCard label="Participants" value={dashboard.total_participants} tone="neutral" />
            <StatCard label="Completed" value={dashboard.completed_events} />
            <StatCard label="Cancelled" value={dashboard.cancelled_events} tone="neutral" />
          </View>

          <SectionHeader
            title="Upcoming Events"
            subtitle="Powered by payload.data.upcoming_events"
          />
          {dashboard.upcoming_events.length ? (
            <View style={styles.list}>
              {dashboard.upcoming_events.map((event) => (
                <EventCard
                  key={event.id}
                  compact
                  event={toDashboardEvent(event)}
                  favoriteLabel="Details"
                  onToggleFavorite={() =>
                    navigation.navigate(ORGANIZER_STACK_ROUTES.EventDetail, {
                      eventId: event.id,
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyState
              title="No upcoming events"
              message="Your next event will appear here once it has been created."
            />
          )}
        </>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.lg,
  },
});
