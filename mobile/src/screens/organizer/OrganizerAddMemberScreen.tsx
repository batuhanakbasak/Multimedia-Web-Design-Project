import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { FilterChip } from '../../components/common/FilterChip';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppInput } from '../../components/forms/AppInput';
import { showToast } from '../../components/common/ToastProvider';
import { type OrganizerStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';
import { saveOrganizerClubMember } from '../../services/organizer.service';
import { handleApiError } from '../../utils/errorHandler';
import {
  saveClubMemberSchema,
  type SaveClubMemberFormValues,
} from '../../utils/validators';

type Props = NativeStackScreenProps<OrganizerStackParamList, 'OrganizerAddMember'>;

export const OrganizerAddMemberScreen = ({ navigation, route }: Props) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SaveClubMemberFormValues>({
    resolver: zodResolver(saveClubMemberSchema),
    defaultValues: {
      user_id: '',
      member_role: 'member',
    },
  });

  const selectedRole = watch('member_role');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveOrganizerClubMember(route.params.clubId, {
        user_id: Number(values.user_id),
        member_role: values.member_role,
      });
      showToast('Club member saved successfully.', 'success');
      navigation.goBack();
    } catch (error) {
      const mapped = handleApiError(error);
      Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof SaveClubMemberFormValues, { message });
      });
      showToast(mapped.message, 'error');
    }
  });

  return (
    <ScreenContainer>
      <AppHeader
        title="Add or Update Member"
        subtitle={route.params.clubName || 'Club membership editor'}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          If this user is already a member, the backend updates the existing membership.
        </Text>
      </View>

      <Controller
        control={control}
        name="user_id"
        render={({ field: { value, onChange } }) => (
          <AppInput
            label="User ID"
            value={value}
            onChangeText={onChange}
            keyboardType="number-pad"
            error={errors.user_id?.message}
          />
        )}
      />

      <View style={styles.roleWrap}>
        {(['member', 'manager'] as const).map((role) => (
          <FilterChip
            key={role}
            label={role}
            active={selectedRole === role}
            onPress={() => setValue('member_role', role)}
          />
        ))}
      </View>

      <PrimaryButton title="Save Member" onPress={onSubmit} loading={isSubmitting} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  notice: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: '#cbe8e4',
    padding: theme.spacing.lg,
  },
  noticeText: {
    color: theme.colors.primaryDeep,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
  },
  roleWrap: {
    flexDirection: 'row',
    gap: 10,
  },
});
