import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { Avatar } from '../../components/common/Avatar';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { showToast } from '../../components/common/ToastProvider';
import { theme } from '../../constants/theme';
import { type OrganizerStackParamList } from '../../constants/routes';
import {
  getOrganizerParticipants,
  removeOrganizerParticipant,
} from '../../services/organizer.service';
import type { EventParticipant } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';
import { formatDateTime } from '../../utils/formatDate';

type Props = NativeStackScreenProps<OrganizerStackParamList, 'OrganizerParticipants'>;

export const OrganizerParticipantsScreen = ({ navigation, route }: Props) => {
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [target, setTarget] = useState<EventParticipant | null>(null);
  const [busy, setBusy] = useState(false);

  const loadParticipants = useCallback(async () => {
    try {
      setErrorMessage('');
      setLoading(true);
      const response = await getOrganizerParticipants(route.params.eventId);
      setParticipants(response);
    } catch (error) {
      setErrorMessage(handleApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [route.params.eventId]);

  useEffect(() => {
    void loadParticipants();
  }, [loadParticipants]);

  const handleRemove = useCallback(async () => {
    if (!target) {
      return;
    }

    try {
      setBusy(true);
      await removeOrganizerParticipant(route.params.eventId, target.id);
      setParticipants((previous) => previous.filter((item) => item.id !== target.id));
      showToast('Participant removed from the list.', 'success');
      setTarget(null);
    } catch (error) {
      showToast(handleApiError(error).message, 'error');
    } finally {
      setBusy(false);
    }
  }, [route.params.eventId, target]);

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingView message="Loading participants..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title="Participants"
        subtitle={route.params.eventTitle || 'Event participants'}
        onBackPress={() => navigation.goBack()}
      />

      {errorMessage ? <ErrorView message={errorMessage} onRetry={loadParticipants} /> : null}
      {!errorMessage && !participants.length ? (
        <EmptyState
          title="No participants yet"
          message="There are no active registrations for this event yet."
        />
      ) : null}

      <View style={styles.list}>
        {participants.map((participant) => (
          <View key={participant.id} style={styles.card}>
            <View style={styles.row}>
              <Avatar name={participant.full_name} uri={participant.profile_image} size={48} />
              <View style={styles.copy}>
                <Text style={styles.name}>{participant.full_name}</Text>
                <Text style={styles.meta}>{participant.email}</Text>
                <Text style={styles.meta}>{formatDateTime(participant.joined_at)}</Text>
              </View>
            </View>
            <SecondaryButton title="Remove Participant" onPress={() => setTarget(participant)} />
          </View>
        ))}
      </View>

      <ConfirmModal
        visible={Boolean(target)}
        title="Remove this participant?"
        message={`${target?.full_name || 'This user'} will be removed from the participant list.`}
        confirmLabel="Remove"
        loading={busy}
        onCancel={() => setTarget(null)}
        onConfirm={handleRemove}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 20,
  },
  meta: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 14,
  },
});
