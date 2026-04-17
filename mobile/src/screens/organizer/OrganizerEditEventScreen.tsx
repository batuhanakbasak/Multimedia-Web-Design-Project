import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AppHeader } from '../../components/common/AppHeader';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { showToast } from '../../components/common/ToastProvider';
import { EventForm } from '../../components/event/EventForm';
import { type OrganizerStackParamList } from '../../constants/routes';
import {
  getOrganizerClubs,
  getOrganizerEventDetail,
  updateOrganizerEvent,
} from '../../services/organizer.service';
import type { ClubItem } from '../../types/club';
import { handleApiError } from '../../utils/errorHandler';
import {
  organizerEventSchema,
  type OrganizerEventFormValues,
} from '../../utils/validators';

type Props = NativeStackScreenProps<OrganizerStackParamList, 'OrganizerEditEvent'>;

const toPayload = (values: OrganizerEventFormValues) => ({
  club_id: values.club_id ? Number(values.club_id) : null,
  title: values.title,
  description: values.description,
  category: values.category,
  event_date: values.event_date,
  location: values.location,
  image_url: values.image_url || null,
  quota: Number(values.quota),
  status: values.status || undefined,
  metadata: values.map_link ? { map_link: values.map_link } : {},
});

export const OrganizerEditEventScreen = ({ navigation, route }: Props) => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const {
    control,
    handleSubmit,
    setError,
    reset,
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
      status: 'active',
    },
  });

  const loadEvent = useCallback(async () => {
    try {
      setErrorMessage('');
      setLoading(true);
      const [eventResponse, clubsResponse] = await Promise.all([
        getOrganizerEventDetail(route.params.eventId),
        getOrganizerClubs(),
      ]);

      setClubs(clubsResponse);
      reset({
        club_id: eventResponse.club_id ? String(eventResponse.club_id) : '',
        title: eventResponse.title,
        description: eventResponse.description,
        category: eventResponse.category,
        event_date: eventResponse.event_date,
        location: eventResponse.location,
        image_url: eventResponse.image_url || '',
        quota: String(eventResponse.quota),
        map_link: eventResponse.metadata?.map_link || '',
        status: eventResponse.status,
      });
    } catch (error) {
      setErrorMessage(handleApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [reset, route.params.eventId]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateOrganizerEvent(route.params.eventId, toPayload(values));
      showToast('Event updated successfully.', 'success');
      navigation.goBack();
    } catch (error) {
      const mapped = handleApiError(error);
      Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof OrganizerEventFormValues, { message });
      });
      showToast(mapped.message, 'error');
    }
  });

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingView message="Preparing event data..." />
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

  return (
    <ScreenContainer>
      <AppHeader title="Edit Event" onBackPress={() => navigation.goBack()} />
      <EventForm control={control} errors={errors} isEdit clubOptions={clubs} />
      <PrimaryButton title="Save Changes" onPress={onSubmit} loading={isSubmitting} />
    </ScreenContainer>
  );
};
