import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { showToast } from '../../components/common/ToastProvider';
import {
  STUDENT_STACK_ROUTES,
  type StudentStackParamList,
} from '../../constants/routes';
import { theme } from '../../constants/theme';
import {
  addStudentFavorite,
  getStudentEventDetail,
  joinStudentEvent,
  leaveStudentEvent,
  removeStudentFavorite,
} from '../../services/student.service';
import { useUserStore } from '../../store/user.store';
import type { EventItem } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';
import { canJoinEvent, canLeaveEvent } from '../../utils/eventState';
import { formatDateTime } from '../../utils/formatDate';

type Props = NativeStackScreenProps<StudentStackParamList, 'StudentEventDetail'>;

export const StudentEventDetailScreen = ({ navigation, route }: Props) => {
  const setFavoriteStatus = useUserStore((state) => state.setFavoriteStatus);
  const setJoinedStatus = useUserStore((state) => state.setJoinedStatus);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<'favorite' | 'join' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadEvent = useCallback(async () => {
    try {
      setErrorMessage('');
      setLoading(true);
      const response = await getStudentEventDetail(route.params.eventId);
      setEvent(response);
    } catch (error) {
      setErrorMessage(handleApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [route.params.eventId]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const canJoin = useMemo(() => {
    if (!event) {
      return false;
    }

    return canJoinEvent(event);
  }, [event]);

  const canLeave = useMemo(() => {
    if (!event) {
      return false;
    }

    return canLeaveEvent(event);
  }, [event]);

  const toggleFavorite = useCallback(async () => {
    if (!event) {
      return;
    }

    const nextFavorite = !event.is_favorite;
    setBusyAction('favorite');
    setEvent((previous) => (previous ? { ...previous, is_favorite: nextFavorite } : previous));
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
      setEvent((previous) =>
        previous ? { ...previous, is_favorite: Boolean(event.is_favorite) } : previous
      );
      setFavoriteStatus(event.id, Boolean(event.is_favorite));
      showToast(handleApiError(error).message, 'error');
    } finally {
      setBusyAction(null);
    }
  }, [event, setFavoriteStatus]);

  const toggleJoin = useCallback(async () => {
    if (!event) {
      return;
    }

    if (event.is_joined && !canLeaveEvent(event)) {
      showToast('Leaving past or closed events is disabled.', 'info');
      return;
    }

    if (!event.is_joined && !canJoinEvent(event)) {
      showToast('This event is not open for registration right now.', 'info');
      return;
    }

    setBusyAction('join');

    try {
      if (event.is_joined) {
        const response = await leaveStudentEvent(event.id);
        setJoinedStatus(event.id, response.is_joined);
        setEvent((previous) =>
          previous
            ? {
                ...previous,
                is_joined: response.is_joined,
                is_favorite: response.is_favorite,
                joined_count: response.joined_count,
              }
            : previous
        );
        showToast('You left the event.', 'info');
      } else {
        const response = await joinStudentEvent(event.id);
        setJoinedStatus(event.id, response.is_joined);
        setEvent((previous) =>
          previous
            ? {
                ...previous,
                is_joined: response.is_joined,
                is_favorite: response.is_favorite,
                joined_count: response.joined_count,
              }
            : previous
        );
        showToast('You joined the event.', 'success');
      }
    } catch (error) {
      showToast(handleApiError(error).message, 'error');
    } finally {
      setBusyAction(null);
    }
  }, [event, setJoinedStatus]);

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingView message="Loading event details..." />
      </ScreenContainer>
    );
  }

  if (errorMessage) {
    return (
      <ScreenContainer>
        <ErrorView message={errorMessage} onRetry={loadEvent} />
      </ScreenContainer>
    );
  }

  if (!event) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Event not found"
          message="This event may no longer be available."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title="Event Details"
        subtitle={event.club?.name || event.organizer?.full_name || 'Campus event'}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.hero}>
        <Text style={styles.category}>{event.category}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description}>{event.description}</Text>
        <View style={styles.badges}>
          <StatusBadge status={event.status} />
          <StatusBadge status={event.timeline_status || event.status} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoRow}>Date: {formatDateTime(event.event_date)}</Text>
        <Text style={styles.infoRow}>Location: {event.location}</Text>
        <Text style={styles.infoRow}>
          Quota: {event.joined_count ?? 0}/{event.quota}
        </Text>
        {event.organizer?.full_name ? (
          <Text style={styles.infoRow}>Organizer: {event.organizer.full_name}</Text>
        ) : null}
        {event.club?.name ? <Text style={styles.infoRow}>Club: {event.club.name}</Text> : null}
      </View>

      <View style={styles.actionBlock}>
        <PrimaryButton
          title={
            event.is_joined
              ? canLeave
                ? 'Leave Event'
                : 'Leaving Disabled'
              : 'Join Event'
          }
          onPress={toggleJoin}
          disabled={event.is_joined ? !canLeave : !canJoin}
          loading={busyAction === 'join'}
        />
        <SecondaryButton
          title={event.is_favorite ? 'Remove Favorite' : 'Add to Favorites'}
          onPress={toggleFavorite}
          disabled={busyAction === 'favorite'}
        />
        {event.metadata?.map_link ? (
          <SecondaryButton
            title="Open Map"
            onPress={() => Linking.openURL(event.metadata?.map_link || '')}
          />
        ) : null}
        {event.club?.id ? (
          <SecondaryButton
            title="Go to Club Details"
            onPress={() =>
              navigation.navigate(STUDENT_STACK_ROUTES.ClubDetail, {
                clubId: event.club!.id,
              })
            }
          />
        ) : null}
      </View>

      {!canJoin && !event.is_joined ? (
        <Text style={styles.warningText}>
          This event is not open for registration right now. The action is disabled because of the event status or quota.
        </Text>
      ) : null}

      {event.is_joined && !canLeave ? (
        <Text style={styles.warningText}>
          Registration cancellation is disabled for past or closed events.
        </Text>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  hero: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  category: {
    color: theme.colors.primaryDeep,
    fontFamily: theme.typography.bodyBold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 30,
  },
  description: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  infoRow: {
    color: theme.colors.text,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 15,
  },
  actionBlock: {
    gap: theme.spacing.md,
  },
  warningText: {
    color: theme.colors.warning,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
  },
});
