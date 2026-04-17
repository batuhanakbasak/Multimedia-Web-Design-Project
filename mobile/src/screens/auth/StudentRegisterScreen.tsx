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
import { studentRegister } from '../../services/auth.service';
import { handleApiError } from '../../utils/errorHandler';
import {
  registerStudentSchema,
  type RegisterStudentFormValues,
} from '../../utils/validators';

type Props = NativeStackScreenProps<AuthStackParamList, 'StudentRegister'>;

export const StudentRegisterScreen = ({ navigation }: Props) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterStudentFormValues>({
    resolver: zodResolver(registerStudentSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await studentRegister({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      });

      showToast('Registration completed. You can sign in now.', 'success');
      navigation.navigate(AUTH_ROUTES.StudentLogin, {
        prefilledEmail: values.email,
        successMessage: 'Your account has been created successfully. Sign in to continue to the student area.',
      });
    } catch (error) {
      const mapped = handleApiError(error, 'Something went wrong while registering.');

      Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof RegisterStudentFormValues, { message });
      });

      showToast(mapped.message, 'error');
    }
  });

  return (
    <ScreenContainer>
      <AppHeader
        title="Create Student Account"
        subtitle="Create your account to follow campus events, save favorites, and explore clubs."
        onBackPress={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate(AUTH_ROUTES.RoleSelection)
        }
      />

      <View style={styles.formCard}>
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

        <Controller
          control={control}
          name="confirm_password"
          render={({ field: { value, onChange } }) => (
            <PasswordInput
              label="Confirm password"
              value={value}
              onChangeText={onChange}
              error={errors.confirm_password?.message}
            />
          )}
        />

        <PrimaryButton title="Create Account" onPress={onSubmit} loading={isSubmitting} />
        <SecondaryButton
          title="Already have an account? Sign in"
          onPress={() => navigation.navigate(AUTH_ROUTES.StudentLogin)}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
