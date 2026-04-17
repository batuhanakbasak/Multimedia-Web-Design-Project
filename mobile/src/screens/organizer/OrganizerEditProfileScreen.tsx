import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppInput } from '../../components/forms/AppInput';
import { showToast } from '../../components/common/ToastProvider';
import { type OrganizerStackParamList } from '../../constants/routes';
import { updateOrganizerProfile } from '../../services/organizer.service';
import { useAuthStore } from '../../store/auth.store';
import { handleApiError } from '../../utils/errorHandler';
import { profileSchema, type ProfileFormValues } from '../../utils/validators';

type Props = NativeStackScreenProps<OrganizerStackParamList, 'OrganizerEditProfile'>;

export const OrganizerEditProfileScreen = ({ navigation }: Props) => {
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      profile_image: '',
    },
  });

  useEffect(() => {
    setValue('full_name', currentUser?.full_name || '');
    setValue('profile_image', currentUser?.profile_image || '');
  }, [currentUser?.full_name, currentUser?.profile_image, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await updateOrganizerProfile({
        full_name: values.full_name,
        profile_image: values.profile_image || null,
      });
      await setUser(response);
      showToast('Profile updated successfully.', 'success');
      navigation.goBack();
    } catch (error) {
      const mapped = handleApiError(error);
      Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof ProfileFormValues, { message });
      });
      showToast(mapped.message, 'error');
    }
  });

  return (
    <ScreenContainer>
      <AppHeader title="Organizer Profile" onBackPress={() => navigation.goBack()} />
      <Controller
        control={control}
        name="full_name"
        render={({ field: { value, onChange } }) => (
          <AppInput
            label="Full name"
            value={value}
            onChangeText={onChange}
            error={errors.full_name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="profile_image"
        render={({ field: { value, onChange } }) => (
          <AppInput
            label="Profile image URL"
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
            error={errors.profile_image?.message}
          />
        )}
      />
      <PrimaryButton title="Save Changes" onPress={onSubmit} loading={isSubmitting} />
    </ScreenContainer>
  );
};
