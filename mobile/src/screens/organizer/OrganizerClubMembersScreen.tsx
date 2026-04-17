import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { Avatar } from '../../components/common/Avatar';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorView } from '../../components/common/ErrorView';
import { LoadingView } from '../../components/common/LoadingView';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { showToast } from '../../components/common/ToastProvider';
import {
  ORGANIZER_STACK_ROUTES,
  type OrganizerStackParamList,
} from '../../constants/routes';
import { theme } from '../../constants/theme';
import {
  getOrganizerClubMembers,
  removeOrganizerClubMember,
  saveOrganizerClubMember,
} from '../../services/organizer.service';
import { useAuthStore } from '../../store/auth.store';
import type { ClubMember } from '../../types/club';
import { handleApiError } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<OrganizerStackParamList, 'OrganizerClubMembers'>;

export const OrganizerClubMembersScreen = ({ navigation, route }: Props) => {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [removeTarget, setRemoveTarget] = useState<ClubMember | null>(null);
  const [busy, setBusy] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      setErrorMessage('');
      setLoading(true);
      const response = await getOrganizerClubMembers(route.params.clubId);
      setMembers(response);
    } catch (error) {
      setErrorMessage(handleApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [route.params.clubId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const promoteMember = useCallback(
    async (member: ClubMember) => {
      try {
        await saveOrganizerClubMember(route.params.clubId, {
          user_id: member.id,
          member_role: 'manager',
        });
        setMembers((previous) =>
          previous.map((item) =>
            item.id === member.id ? { ...item, member_role: 'manager' } : item
          )
        );
        showToast('Member role updated to manager.', 'success');
      } catch (error) {
        showToast(handleApiError(error).message, 'error');
      }
    },
    [route.params.clubId]
  );

  const handleRemove = useCallback(async () => {
    if (!removeTarget) {
      return;
    }

    try {
      setBusy(true);
      await removeOrganizerClubMember(route.params.clubId, removeTarget.id);
      setMembers((previous) => previous.filter((item) => item.id !== removeTarget.id));
      showToast('Member removed from the club.', 'success');
      setRemoveTarget(null);
    } catch (error) {
      showToast(handleApiError(error).message, 'error');
    } finally {
      setBusy(false);
    }
  }, [removeTarget, route.params.clubId]);

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingView message="Loading club members..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title={route.params.clubName || 'Club Members'}
        subtitle="Manage member roles and club actions"
        onBackPress={() => navigation.goBack()}
      />

      <PrimaryButton
        title="Add New Member"
        onPress={() =>
          navigation.navigate(ORGANIZER_STACK_ROUTES.AddMember, {
            clubId: route.params.clubId,
            clubName: route.params.clubName,
          })
        }
      />

      {errorMessage ? <ErrorView message={errorMessage} onRetry={loadMembers} /> : null}
      {!errorMessage && !members.length ? (
        <EmptyState title="No members found" message="Club members will appear here." />
      ) : null}

      <View style={styles.list}>
        {members.map((member) => {
          const isCurrentUser = member.id === currentUserId;

          return (
            <View key={member.id} style={styles.card}>
              <View style={styles.row}>
                <Avatar name={member.full_name} uri={member.profile_image} size={48} />
                <View style={styles.copy}>
                  <Text style={styles.name}>{member.full_name}</Text>
                  <Text style={styles.meta}>{member.email}</Text>
                  <Text style={styles.meta}>
                    {member.role} - {member.member_role}
                    {isCurrentUser ? ' - You' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                {member.member_role !== 'manager' ? (
                  <SecondaryButton title="Promote to Manager" onPress={() => promoteMember(member)} />
                ) : null}
                {!isCurrentUser ? (
                  <SecondaryButton
                    title="Remove Member"
                    onPress={() => setRemoveTarget(member)}
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <ConfirmModal
        visible={Boolean(removeTarget)}
        title="Remove this member?"
        message={`${removeTarget?.full_name || 'This user'} will be removed from the club.`}
        confirmLabel="Remove"
        loading={busy}
        onCancel={() => setRemoveTarget(null)}
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
  actions: {
    gap: theme.spacing.sm,
  },
});
