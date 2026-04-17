import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { showToast } from '../../components/common/ToastProvider';
import { EventCard } from '../../components/event/EventCard';
import { STUDENT_STACK_ROUTES, type StudentStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import {
  getStudentFavorites,
  joinStudentEvent,
  leaveStudentEvent,
  removeStudentFavorite,
} from '../../services/student.service';
import { useUserStore } from '../../store/user.store';
import type { EventItem } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';
import { canJoinEvent, canLeaveEvent } from '../../utils/eventState';

export const StudentFavoritesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();
  const setFavoriteStatus = useUserStore((state) => state.setFavoriteStatus);
  const setJoinedStatus = useUserStore((state) => state.setJoinedStatus);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadFavorites = useCallback(async (isRefresh = false) => {
    try {
      setErrorMessage('');
      isRefresh ? setRefreshing(true) : setLoading(true);
      const response = await getStudentFavorites();
      setEvents(response);
    } catch (error) {
      setErrorMessage(handleApiError(error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = useCallback(
    async (event: EventItem) => {
      try {
        await removeStudentFavorite(event.id);
        setFavoriteStatus(event.id, false);
        setEvents((previous) => previous.filter((item) => item.id !== event.id));
        showToast('Removed from favorites.', 'info');
      } catch (error) {
        showToast(handleApiError(error).message, 'error');
      }
    },
    [setFavoriteStatus]
  );

  const toggleJoin = useCallback(
    async (event: EventItem) => {
      if (event.is_joined && !canLeaveEvent(event)) {
        showToast('Leaving past or closed events is disabled.', 'info');
        return;
      }

      if (!event.is_joined && !canJoinEvent(event)) {
        showToast('This event is not open for registration right now.', 'info');
        return;
      }

      try {
        if (event.is_joined) {
          const response = await leaveStudentEvent(event.id);
          setJoinedStatus(event.id, response.is_joined);
          setEvents((previous) =>
            previous.map((item) =>
              item.id === event.id
                ? {
                    ...item,
                    is_joined: response.is_joined,
                    joined_count: response.joined_count,
                  }
                : item
            )
          );
          showToast('You left the event.', 'info');
        } else {
          const response = await joinStudentEvent(event.id);
          setJoinedStatus(event.id, response.is_joined);
          setEvents((previous) =>
            previous.map((item) =>
              item.id === event.id
                ? {
                    ...item,
                    is_joined: response.is_joined,
                    joined_count: response.joined_count,
                  }
                : item
            )
          );
          showToast('You joined the event.', 'success');
        }
      } catch (error) {
        showToast(handleApiError(error).message, 'error');
      }
    },
    [setJoinedStatus]
  );

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadFavorites(true)}
          tintColor={theme.colors.primary}
        />
      }
    >
      <AppHeader
        title="Favorites"
        subtitle="Manage the events you are interested in from here."
      />

      {loading ? <LoadingView variant="cards" /> : null}
      {errorMessage ? <ErrorView message={errorMessage} onRetry={() => loadFavorites()} /> : null}
      {!loading && !errorMessage && !events.length ? (
        <EmptyState
          title="No favorite events yet"
          message="Favorited event cards from Explore will appear here."
        />
      ) : null}

      <View style={styles.list}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() =>
              navigation.navigate(STUDENT_STACK_ROUTES.EventDetail, {
                eventId: event.id,
              })
            }
            onToggleFavorite={() => removeFavorite(event)}
            onJoinLeave={() => toggleJoin(event)}
            joinLeaveLabel={
              event.is_joined
                ? canLeaveEvent(event)
                  ? 'Leave'
                  : 'Leaving Disabled'
                : 'Join'
            }
            joinLeaveDisabled={event.is_joined ? !canLeaveEvent(event) : !canJoinEvent(event)}
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
