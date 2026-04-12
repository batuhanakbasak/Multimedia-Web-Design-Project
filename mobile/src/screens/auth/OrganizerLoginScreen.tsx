import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { showToast } from '../../components/common/ToastProvider';
import { AppInput } from '../../components/forms/AppInput';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { AUTH_ROUTES, type AuthStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import { organizerLogin } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { handleApiError } from '../../utils/errorHandler';
import {
  organizerLoginSchema,
  type OrganizerLoginFormValues,
} from '../../utils/validators';

type Props = NativeStackScreenProps<AuthStackParamList, 'OrganizerLogin'>;

export const OrganizerLoginScreen = ({ navigation }: Props) => {
  const loginSuccess = useAuthStore((state) => state.loginSuccess);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrganizerLoginFormValues>({
    resolver: zodResolver(organizerLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = await organizerLogin(values);
      await loginSuccess(payload);
      showToast('Organizer sign in was successful.', 'success');
    } catch (error) {
      const mapped = handleApiError(error, 'Something went wrong while signing in.');

      Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof OrganizerLoginFormValues, { message });
      });

      showToast(mapped.message, 'error');
    }
  });

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <AppHeader
        title="Organizer Sign In"
        subtitle="Manage events, participants, and club teams from a single panel."
        onBackPress={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate(AUTH_ROUTES.RoleSelection)
        }
      />

      <View style={styles.formCard}>
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange } }) => (
            <AppInput
              label="Email"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange } }) => (
            <PasswordInput
              label="Password"
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <PrimaryButton
          title="Sign In as Organizer"
          onPress={onSubmit}
          loading={isSubmitting}
        />
        <SecondaryButton
          title="Back to role selection"
          onPress={() => navigation.navigate(AUTH_ROUTES.RoleSelection)}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  formCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    ...theme.shadow.card,
  },
});
