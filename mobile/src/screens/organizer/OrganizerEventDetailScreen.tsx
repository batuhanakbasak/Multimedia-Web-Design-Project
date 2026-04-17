import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { showToast } from '../../components/common/ToastProvider';
import { ORGANIZER_STACK_ROUTES, type OrganizerStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import { cancelOrganizerEvent, getOrganizerEventDetail } from '../../services/organizer.service';
import type { EventItem } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';
import { formatDateTime } from '../../utils/formatDate';

type Props = NativeStackScreenProps<OrganizerStackParamList, 'OrganizerEventDetail'>;

export const OrganizerEventDetailScreen = ({ navigation, route }: Props) => {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadEvent = useCallback(async () => {
    try {
      setErrorMessage('');
      setLoading(true);
      const response = await getOrganizerEventDetail(route.params.eventId);
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

  const handleCancelEvent = useCallback(async () => {
    if (!event) {
      return;
    }

    try {
      setBusy(true);
      await cancelOrganizerEvent(event.id);
      setEvent((previous) =>
        previous
          ? { ...previous, status: 'cancelled', timeline_status: 'cancelled' }
          : previous
      );
      setConfirmVisible(false);
      showToast('Event cancelled successfully.', 'success');
    } catch (error) {
      showToast(handleApiError(error).message, 'error');
    } finally {
      setBusy(false);
    }
  }, [event]);

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
        <EmptyState title="Event not found" message="This event is not accessible." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader title="Event Details" onBackPress={() => navigation.goBack()} />

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
        <Text style={styles.infoRow}>Quota: {event.joined_count ?? 0}/{event.quota}</Text>
        {event.club?.name ? <Text style={styles.infoRow}>Club: {event.club.name}</Text> : null}
        {event.organizer?.full_name ? (
          <Text style={styles.infoRow}>Organizer: {event.organizer.full_name}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title="Edit Event"
          onPress={() =>
            navigation.navigate(ORGANIZER_STACK_ROUTES.EditEvent, {
              eventId: event.id,
            })
          }
        />
        <SecondaryButton
          title="View Participants"
          onPress={() =>
            navigation.navigate(ORGANIZER_STACK_ROUTES.Participants, {
              eventId: event.id,
              eventTitle: event.title,
            })
          }
        />
        {event.metadata?.map_link ? (
          <SecondaryButton
            title="Open Map"
            onPress={() => Linking.openURL(event.metadata?.map_link || '')}
          />
        ) : null}
        <SecondaryButton title="Cancel Event" onPress={() => setConfirmVisible(true)} />
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title="Cancel this event"
        message="This action will update the event status to cancelled."
        confirmLabel="Cancel Event"
        loading={busy}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleCancelEvent}
      />
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
  actions: {
    gap: theme.spacing.md,
  },
});
