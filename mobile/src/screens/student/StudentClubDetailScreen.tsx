import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SectionHeader } from '../../components/common/SectionHeader';
import { EventCard } from '../../components/event/EventCard';
import { STUDENT_STACK_ROUTES, type StudentStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import { getStudentClubDetail } from '../../services/student.service';
import type { ClubDetail } from '../../types/club';
import type { EventItem } from '../../types/event';
import { handleApiError } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<StudentStackParamList, 'StudentClubDetail'>;

const toEventItem = (event: ClubDetail['upcoming_events'][number]): EventItem => ({
  ...event,
  club_id: event.club_id ?? null,
  organizer_id: event.organizer_id ?? 0,
  description: event.description || 'Club event',
  image_url: event.image_url ?? null,
  quota: event.quota ?? 0,
});

export const StudentClubDetailScreen = ({ navigation, route }: Props) => {
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadClub = useCallback(async () => {
    try {
      setErrorMessage('');
      setLoading(true);
      const response = await getStudentClubDetail(route.params.clubId);
      setClub(response);
    } catch (error) {
      setErrorMessage(handleApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [route.params.clubId]);

  useEffect(() => {
    void loadClub();
  }, [loadClub]);

  const managerNames = useMemo(
    () => club?.managers?.map((manager) => manager.full_name).join(', ') || '-',
    [club?.managers]
  );

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingView message="Loading club details..." />
      </ScreenContainer>
    );
  }

  if (errorMessage) {
    return (
      <ScreenContainer>
        <ErrorView message={errorMessage} onRetry={loadClub} />
      </ScreenContainer>
    );
  }

  if (!club) {
    return (
      <ScreenContainer>
        <EmptyState title="Club not found" message="This club may no longer be accessible." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader title={club.name} subtitle="Club details" onBackPress={() => navigation.goBack()} />

      <View style={styles.hero}>
        <Text style={styles.title}>{club.name}</Text>
        <Text style={styles.description}>{club.description || 'No club description available.'}</Text>
        <Text style={styles.metaText}>Managers: {managerNames}</Text>
      </View>

      <SectionHeader title="Upcoming Events" subtitle="Next activities planned by this club" />
      {club.upcoming_events.length ? (
        <View style={styles.list}>
          {club.upcoming_events.map((event) => (
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
          title="No upcoming events yet"
          message="New events from this club will appear here once they are published."
        />
      )}
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
  metaText: {
    color: theme.colors.text,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 15,
  },
  list: {
    gap: theme.spacing.lg,
  },
});
