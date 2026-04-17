import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { theme } from '../../constants/theme';
import { getPublicEventDetail } from '../../services/events.service';
import type { EventItem } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';
import { formatDateTime } from '../../utils/formatDate';

interface PublicEventDetailScreenProps {
  eventId: number;
  onBack?: () => void;
}

export const PublicEventDetailScreen = ({
  eventId,
  onBack,
}: PublicEventDetailScreenProps) => {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadEvent = useCallback(async () => {
    try {
      setErrorMessage('');
      setLoading(true);
      const response = await getPublicEventDetail(eventId);
      setEvent(response);
    } catch (error) {
      setErrorMessage(handleApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingView message="Loading event..." />
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
        <EmptyState title="Event not found" message="The shared event information could not be displayed." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader title={event.title} subtitle="Public event overview" onBackPress={onBack} />
      <View style={styles.card}>
        <Text style={styles.meta}>{event.category}</Text>
        <Text style={styles.description}>{event.description}</Text>
        <Text style={styles.meta}>Date: {formatDateTime(event.event_date)}</Text>
        <Text style={styles.meta}>Location: {event.location}</Text>
        <View style={styles.badges}>
          <StatusBadge status={event.status} />
          <StatusBadge status={event.timeline_status || event.status} />
        </View>
        {event.metadata?.map_link ? (
          <SecondaryButton
            title="Open Map"
            onPress={() => Linking.openURL(event.metadata?.map_link || '')}
          />
        ) : null}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  meta: {
    color: theme.colors.text,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 15,
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
});
