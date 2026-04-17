import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';
import type { User } from '../../types/user';

import { Avatar } from '../common/Avatar';
import { StatusBadge } from '../common/StatusBadge';

interface ProfileHeaderProps {
  user: User;
}

export const ProfileHeader = ({ user }: ProfileHeaderProps) => {
  return (
    <View style={styles.container}>
      <Avatar name={user.full_name} uri={user.profile_image} size={72} />
      <View style={styles.copy}>
        <Text style={styles.name}>{user.full_name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.meta}>
          <StatusBadge status={user.is_active ? 'active' : 'cancelled'} />
          <Text style={styles.role}>{user.role.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 24,
  },
  email: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 15,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  role: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.bodyBold,
    fontSize: 13,
  },
});
