import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../../components/common/AppHeader';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { FilterChip } from '../../components/common/FilterChip';
import { LoadingView } from '../../components/common/LoadingView';
import { PaginationFooter } from '../../components/common/PaginationFooter';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { showToast } from '../../components/common/ToastProvider';
import { EventCard } from '../../components/event/EventCard';
import { SearchInput } from '../../components/forms/SearchInput';
import { EVENT_SORT_OPTIONS } from '../../constants/api';
import { ORGANIZER_STACK_ROUTES, type OrganizerStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { cancelOrganizerEvent, getOrganizerEvents } from '../../services/organizer.service';
import type { EventItem } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';

export const OrganizerEventsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OrganizerStackParamList>>();
  const { page, limit, hasMore, meta, nextPage, syncMeta } = usePagination(10);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [sort, setSort] = useState<'newest' | 'oldest' | 'upcoming'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cancelTarget, setCancelTarget] = useState<EventItem | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

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

        const response = await getOrganizerEvents({
          page: targetPage,
          limit,
          sort,
          ...(debouncedSearch ? { keyword: debouncedSearch } : {}),
          ...(status ? { status } : {}),
        });

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
    [debouncedSearch, limit, sort, status, syncMeta]
  );

  useEffect(() => {
    void loadEvents(1, true);
  }, [loadEvents]);

  const handleCancel = useCallback(async () => {
    if (!cancelTarget) {
      return;
    }

    try {
      setCancelLoading(true);
      await cancelOrganizerEvent(cancelTarget.id);
      setEvents((previous) =>
        previous.map((item) =>
          item.id === cancelTarget.id
            ? { ...item, status: 'cancelled', timeline_status: 'cancelled' }
            : item
        )
      );
      showToast('Event cancelled successfully.', 'success');
      setCancelTarget(null);
    } catch (error) {
      showToast(handleApiError(error).message, 'error');
    } finally {
      setCancelLoading(false);
    }
  }, [cancelTarget]);

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
        subtitle="Search, edit, and manage the events you own."
      />

      <SearchInput value={search} onChangeText={setSearch} onClear={() => setSearch('')} />

      <View style={styles.filterWrap}>
        {['all', 'active', 'completed', 'cancelled'].map((item) => (
          <FilterChip
            key={item}
            label={item}
            active={(status || 'all') === item}
            onPress={() => setStatus(item === 'all' ? undefined : item)}
          />
        ))}
      </View>

      <View style={styles.filterWrap}>
        {EVENT_SORT_OPTIONS.map((item) => (
          <FilterChip
            key={item.value}
            label={item.label}
            active={sort === item.value}
            onPress={() => setSort(item.value)}
          />
        ))}
      </View>

      {loading ? <LoadingView variant="cards" /> : null}
      {errorMessage ? <ErrorView message={errorMessage} onRetry={() => loadEvents(1, true)} /> : null}
      {!loading && !errorMessage && !events.length ? (
        <EmptyState
          title="No events found"
          message="Change the filters or create a new event to populate this area."
        />
      ) : null}

      <View style={styles.list}>
        {events.map((event) => (
          <View key={event.id} style={styles.cardWrap}>
            <EventCard
              event={event}
              onPress={() =>
                navigation.navigate(ORGANIZER_STACK_ROUTES.EventDetail, {
                  eventId: event.id,
                })
              }
              onToggleFavorite={() =>
                navigation.navigate(ORGANIZER_STACK_ROUTES.EditEvent, {
                  eventId: event.id,
                })
              }
              favoriteLabel="Edit"
              onJoinLeave={() =>
                navigation.navigate(ORGANIZER_STACK_ROUTES.Participants, {
                  eventId: event.id,
                  eventTitle: event.title,
                })
              }
              joinLeaveLabel="Participants"
            />
            <SecondaryButton title="Cancel Event" onPress={() => setCancelTarget(event)} />
          </View>
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

      <ConfirmModal
        visible={Boolean(cancelTarget)}
        title="Cancel this event?"
        message={`${cancelTarget?.title || 'This event'} will be marked as cancelled.`}
        confirmLabel="Cancel Event"
        loading={cancelLoading}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  list: {
    gap: theme.spacing.lg,
  },
  cardWrap: {
    gap: theme.spacing.sm,
  },
});
