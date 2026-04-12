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
import { SearchInput } from '../../components/forms/SearchInput';
import { EVENT_CATEGORIES, EVENT_SORT_OPTIONS } from '../../constants/api';
import {
  STUDENT_STACK_ROUTES,
  type StudentStackParamList,
} from '../../constants/routes';
import { theme } from '../../constants/theme';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import {
  addStudentFavorite,
  getStudentEvents,
  joinStudentEvent,
  leaveStudentEvent,
  removeStudentFavorite,
  searchStudentEvents,
} from '../../services/student.service';
import { useUserStore } from '../../store/user.store';
import type { EventItem } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';
import { canJoinEvent, canLeaveEvent } from '../../utils/eventState';

export const StudentExploreScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParamList>>();
  const hydrateFromEvents = useUserStore((state) => state.hydrateFromEvents);
  const setFavoriteStatus = useUserStore((state) => state.setFavoriteStatus);
  const setJoinedStatus = useUserStore((state) => state.setJoinedStatus);
  const { page, limit, hasMore, meta, nextPage, syncMeta } = usePagination(10);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedSort, setSelectedSort] = useState<'newest' | 'oldest' | 'upcoming'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const debouncedSearch = useDebounce(search, 450);

  const fetchEvents = useCallback(
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

        const params = {
          page: targetPage,
          limit,
          sort: selectedSort,
          ...(debouncedSearch ? { keyword: debouncedSearch } : {}),
          ...(selectedCategory ? { category: selectedCategory } : {}),
        };

        const response = debouncedSearch
          ? await searchStudentEvents(params)
          : await getStudentEvents(params);

        setEvents((previous) => (replace ? response.items : [...previous, ...response.items]));
        syncMeta(response.meta);
        hydrateFromEvents(response.items);
      } catch (error) {
        setErrorMessage(handleApiError(error).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, hydrateFromEvents, limit, selectedCategory, selectedSort, syncMeta]
  );

  useEffect(() => {
    void fetchEvents(1, true);
  }, [fetchEvents]);

  const patchEvent = useCallback((eventId: number, patch: Partial<EventItem>) => {
    setEvents((previous) =>
      previous.map((event) =>
        event.id === eventId
          ? {
              ...event,
              ...patch,
            }
          : event
      )
    );
  }, []);

  const toggleFavorite = useCallback(
    async (event: EventItem) => {
      const nextFavorite = !event.is_favorite;
      patchEvent(event.id, { is_favorite: nextFavorite });
      setFavoriteStatus(event.id, nextFavorite);

      try {
        if (nextFavorite) {
          await addStudentFavorite(event.id);
          showToast('Added to favorites.', 'success');
        } else {
          await removeStudentFavorite(event.id);
          showToast('Removed from favorites.', 'info');
        }
      } catch (error) {
        patchEvent(event.id, { is_favorite: Boolean(event.is_favorite) });
        setFavoriteStatus(event.id, Boolean(event.is_favorite));
        showToast(handleApiError(error).message, 'error');
      }
    },
    [patchEvent, setFavoriteStatus]
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

      const nextJoined = !event.is_joined;
      const currentCount = event.joined_count ?? 0;
      patchEvent(event.id, {
        is_joined: nextJoined,
        joined_count: nextJoined ? currentCount + 1 : Math.max(currentCount - 1, 0),
      });
      setJoinedStatus(event.id, nextJoined);

      try {
        if (nextJoined) {
          const response = await joinStudentEvent(event.id);
          patchEvent(event.id, {
            is_joined: response.is_joined,
            is_favorite: response.is_favorite,
            joined_count: response.joined_count,
          });
          showToast('You joined the event.', 'success');
        } else {
          const response = await leaveStudentEvent(event.id);
          patchEvent(event.id, {
            is_joined: response.is_joined,
            is_favorite: response.is_favorite,
            joined_count: response.joined_count,
          });
          showToast('You left the event.', 'info');
        }
      } catch (error) {
        patchEvent(event.id, {
          is_joined: Boolean(event.is_joined),
          joined_count: currentCount,
        });
        setJoinedStatus(event.id, Boolean(event.is_joined));
        showToast(handleApiError(error).message, 'error');
      }
    },
    [patchEvent, setJoinedStatus]
  );

  const visibleCategoryLabel = useMemo(() => selectedCategory || 'All', [selectedCategory]);

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchEvents(1, true, true)}
          tintColor={theme.colors.primary}
        />
      }
    >
      <AppHeader
        title="Explore Events"
        subtitle={`Category: ${visibleCategoryLabel} - ${
          EVENT_SORT_OPTIONS.find((item) => item.value === selectedSort)?.label || 'Upcoming'
        }`}
      />

      <SearchInput
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
        placeholder="Search events or descriptions"
      />

      <View style={styles.filterSection}>
        <View style={styles.chipWrap}>
          <FilterChip
            label="All"
            active={!selectedCategory}
            onPress={() => setSelectedCategory(undefined)}
          />
          {EVENT_CATEGORIES.map((category) => (
            <FilterChip
              key={category}
              label={category}
              active={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.chipWrap}>
          {EVENT_SORT_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={selectedSort === option.value}
              onPress={() => setSelectedSort(option.value)}
            />
          ))}
        </View>
      </View>

      {loading ? <LoadingView variant="cards" /> : null}
      {errorMessage ? <ErrorView message={errorMessage} onRetry={() => fetchEvents(1, true)} /> : null}
      {!loading && !errorMessage && !events.length ? (
        <EmptyState
          title="No results found"
          message="Try changing the search or filters to discover more events."
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
            onToggleFavorite={() => toggleFavorite(event)}
            onJoinLeave={() => toggleJoin(event)}
            joinLeaveLabel={
              event.is_joined
                ? canLeaveEvent(event)
                  ? 'Cancel Registration'
                  : 'Leaving Disabled'
                : 'Join'
            }
            joinLeaveDisabled={event.is_joined ? !canLeaveEvent(event) : !canJoinEvent(event)}
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
          void fetchEvents(next, false);
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    gap: theme.spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  list: {
    gap: theme.spacing.lg,
  },
});
