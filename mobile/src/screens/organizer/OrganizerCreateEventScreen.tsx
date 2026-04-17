import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../../components/common/AppHeader';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { showToast } from '../../components/common/ToastProvider';
import { EventForm } from '../../components/event/EventForm';
import {
  ORGANIZER_STACK_ROUTES,
  type OrganizerStackParamList,
} from '../../constants/routes';
import { getOrganizerClubs, createOrganizerEvent } from '../../services/organizer.service';
import type { ClubItem } from '../../types/club';
import { handleApiError } from '../../utils/errorHandler';
import {
  organizerEventSchema,
  type OrganizerEventFormValues,
} from '../../utils/validators';

const toPayload = (values: OrganizerEventFormValues) => ({
  club_id: values.club_id ? Number(values.club_id) : null,
  title: values.title,
  description: values.description,
  category: values.category,
  event_date: values.event_date,
  location: values.location,
  image_url: values.image_url || null,
  quota: Number(values.quota),
  metadata: values.map_link ? { map_link: values.map_link } : {},
});

export const OrganizerCreateEventScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OrganizerStackParamList>>();
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubsError, setClubsError] = useState('');
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrganizerEventFormValues>({
    resolver: zodResolver(organizerEventSchema),
    defaultValues: {
      club_id: '',
      title: '',
      description: '',
      category: '',
      event_date: '',
      location: '',
      image_url: '',
      quota: '',
      map_link: '',
    },
  });

  const loadClubs = useCallback(async () => {
    try {
      setClubsError('');
      setClubsLoading(true);
      const response = await getOrganizerClubs();
      setClubs(response);
    } catch (error) {
      setClubsError(handleApiError(error).message);
    } finally {
      setClubsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClubs();
  }, [loadClubs]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await createOrganizerEvent(toPayload(values));
      showToast('Event created successfully.', 'success');
      navigation.navigate(ORGANIZER_STACK_ROUTES.EventDetail, {
        eventId: response.id,
      });
    } catch (error) {
      const mapped = handleApiError(error);
      Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof OrganizerEventFormValues, { message });
      });
      showToast(mapped.message, 'error');
    }
  });

  if (clubsLoading) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingView message="Loading club options..." />
      </ScreenContainer>
    );
  }

  if (clubsError) {
    return (
      <ScreenContainer>
        <ErrorView message={clubsError} onRetry={loadClubs} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title="Create Event"
        subtitle="You can connect the event to one of your own clubs or publish it independently."
      />
      <EventForm control={control} errors={errors} clubOptions={clubs} />
      <PrimaryButton title="Create Event" onPress={onSubmit} loading={isSubmitting} />
    </ScreenContainer>
  );
};
