import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { FilterChip } from '../../components/common/FilterChip';
import { LoadingView } from '../../components/common/LoadingView';
import { PaginationFooter } from '../../components/common/PaginationFooter';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { showToast } from '../../components/common/ToastProvider';
import { EventCard } from '../../components/event/EventCard';
import { STUDENT_STACK_ROUTES, type StudentStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import { usePagination } from '../../hooks/usePagination';
import { getStudentMyEvents, leaveStudentEvent } from '../../services/student.service';
import { useUserStore } from '../../store/user.store';
import type { EventItem } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';
import { canLeaveEvent } from '../../utils/eventState';

type TimelineFilter = 'all' | 'active' | 'passed' | 'cancelled';

export const StudentMyEventsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();
  const setJoinedStatus = useUserStore((state) => state.setJoinedStatus);
  const { page, limit, hasMore, meta, nextPage, syncMeta } = usePagination(10);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadEvents = useCallback(
    async (targetPage = 1, replace = true, isRefresh = false) => {
      try {
        setErrorMessage('');
        if (isRefresh) {
          setRefreshing(true);
        } else if (targetPage > 1) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await getStudentMyEvents({ page: targetPage, limit });
        setEvents((previous) => (replace ? response.items : [...previous, ...response.items]));
        syncMeta(response.meta);
      } catch (error) {
        setErrorMessage(handleApiError(error).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [limit, syncMeta]
  );

  useEffect(() => {
    void loadEvents(1, true);
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') {
      return events;
    }

    return events.filter((event) => (event.timeline_status || event.status) === activeFilter);
  }, [activeFilter, events]);

  const handleLeave = useCallback(
    async (event: EventItem) => {
      if (!canLeaveEvent(event)) {
        showToast('Leaving past or closed events is disabled.', 'info');
        return;
      }

      try {
        const response = await leaveStudentEvent(event.id);
        setJoinedStatus(event.id, response.is_joined);
        setEvents((previous) => previous.filter((item) => item.id !== event.id));
        showToast('You left the event.', 'info');
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
          onRefresh={() => loadEvents(1, true, true)}
          tintColor={theme.colors.primary}
        />
      }
    >
      <AppHeader
        title="My Events"
        subtitle="See your active, past, and cancelled registrations in one place."
      />

      <View style={styles.filters}>
        {(['all', 'active', 'passed', 'cancelled'] as TimelineFilter[]).map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            active={activeFilter === filter}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </View>

      {loading ? <LoadingView variant="cards" /> : null}
      {errorMessage ? <ErrorView message={errorMessage} onRetry={() => loadEvents(1, true)} /> : null}
      {!loading && !errorMessage && !filteredEvents.length ? (
        <EmptyState
          title="No registrations in this filter"
          message="Your joined events will appear here."
        />
      ) : null}

      <View style={styles.list}>
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() =>
              navigation.navigate(STUDENT_STACK_ROUTES.EventDetail, {
                eventId: event.id,
              })
            }
            onJoinLeave={() => handleLeave(event)}
            joinLeaveLabel={canLeaveEvent(event) ? 'Leave Event' : 'Leaving Disabled'}
            joinLeaveDisabled={!canLeaveEvent(event)}
          />
        ))}
      </View>

      <PaginationFooter
        meta={meta}
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={() => {
          const next = page + 1;
          nextPage();
          void loadEvents(next, false);
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  list: {
    gap: theme.spacing.lg,
  },
});
