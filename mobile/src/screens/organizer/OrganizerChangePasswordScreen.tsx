import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { showToast } from '../../components/common/ToastProvider';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { type OrganizerStackParamList } from '../../constants/routes';
import { changeOrganizerPassword } from '../../services/organizer.service';
import { handleApiError } from '../../utils/errorHandler';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '../../utils/validators';

type Props = NativeStackScreenProps<OrganizerStackParamList, 'OrganizerChangePassword'>;

export const OrganizerChangePasswordScreen = ({ navigation }: Props) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_new_password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changeOrganizerPassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      showToast('Password updated successfully.', 'success');
      navigation.goBack();
    } catch (error) {
      const mapped = handleApiError(error);
      Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof ChangePasswordFormValues, { message });
      });
      showToast(mapped.message, 'error');
    }
  });

  return (
    <ScreenContainer>
      <AppHeader title="Change Password" onBackPress={() => navigation.goBack()} />
      <Controller
        control={control}
        name="current_password"
        render={({ field: { value, onChange } }) => (
          <PasswordInput
            label="Current password"
            value={value}
            onChangeText={onChange}
            error={errors.current_password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="new_password"
        render={({ field: { value, onChange } }) => (
          <PasswordInput
            label="New password"
            value={value}
            onChangeText={onChange}
            error={errors.new_password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirm_new_password"
        render={({ field: { value, onChange } }) => (
          <PasswordInput
            label="Confirm new password"
            value={value}
            onChangeText={onChange}
            error={errors.confirm_new_password?.message}
          />
        )}
      />
      <PrimaryButton title="Update Password" onPress={onSubmit} loading={isSubmitting} />
    </ScreenContainer>
  );
};
