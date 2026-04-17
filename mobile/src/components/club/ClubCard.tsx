import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../constants/theme';
import type { ClubItem } from '../../types/club';

interface ClubCardProps {
  club: ClubItem;
  onPress?: () => void;
}

export const ClubCard = ({ club, onPress }: ClubCardProps) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <LinearGradient
        colors={['#fff7ee', '#f3ece1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Ionicons name="people" size={28} color={theme.colors.primaryDeep} />
        <Text style={styles.bannerText}>{club.name}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title}>{club.name}</Text>
        <Text numberOfLines={3} style={styles.description}>
          {club.description || 'Club description will be added soon.'}
        </Text>

        <View style={styles.metaRow}>
          {typeof club.member_count === 'number' ? (
            <Text style={styles.metaText}>{club.member_count} members</Text>
          ) : null}
          {typeof club.event_count === 'number' ? (
            <Text style={styles.metaText}>{club.event_count} events</Text>
          ) : null}
          {club.member_role ? <Text style={styles.metaText}>{club.member_role}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  banner: {
    minHeight: 116,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  bannerText: {
    color: theme.colors.primaryDeep,
    fontFamily: theme.typography.heading,
    fontSize: 22,
  },
  content: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 22,
  },
  description: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 13,
  },
});
