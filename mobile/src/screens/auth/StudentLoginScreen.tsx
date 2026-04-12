import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { showToast } from '../../components/common/ToastProvider';
import { AppInput } from '../../components/forms/AppInput';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { AUTH_ROUTES, type AuthStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import { studentLogin } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { handleApiError } from '../../utils/errorHandler';
import {
  studentLoginSchema,
  type StudentLoginFormValues,
} from '../../utils/validators';

type Props = NativeStackScreenProps<AuthStackParamList, 'StudentLogin'>;

export const StudentLoginScreen = ({ navigation, route }: Props) => {
  const loginSuccess = useAuthStore((state) => state.loginSuccess);
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentLoginFormValues>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (route.params?.prefilledEmail) {
      setValue('email', route.params.prefilledEmail);
    }
  }, [route.params?.prefilledEmail, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = await studentLogin(values);
      await loginSuccess(payload);
      showToast('Student sign in was successful.', 'success');
    } catch (error) {
      const mapped = handleApiError(error, 'Something went wrong while signing in.');

      Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof StudentLoginFormValues, { message });
      });

      showToast(mapped.message, 'error');
    }
  });

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <AppHeader
        title="Student Sign In"
        subtitle="Manage your favorites, joined events, and club activity from one place."
        onBackPress={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate(AUTH_ROUTES.RoleSelection)
        }
      />

      {route.params?.successMessage ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{route.params.successMessage}</Text>
        </View>
      ) : null}

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

        <PrimaryButton title="Sign In" onPress={onSubmit} loading={isSubmitting} />
        <SecondaryButton
          title="Don't have an account? Register"
          onPress={() => navigation.navigate(AUTH_ROUTES.StudentRegister)}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  infoBox: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: '#cbe8e4',
    padding: theme.spacing.lg,
  },
  infoText: {
    color: theme.colors.primaryDeep,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
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
