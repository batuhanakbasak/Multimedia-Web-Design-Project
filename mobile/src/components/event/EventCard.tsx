import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../constants/theme';
import type { EventItem } from '../../types/event';
import { formatDateTime } from '../../utils/formatDate';

import { SecondaryButton } from '../common/SecondaryButton';
import { StatusBadge } from '../common/StatusBadge';

interface EventCardProps {
  event: EventItem;
  compact?: boolean;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  onJoinLeave?: () => void;
  favoriteLabel?: string;
  joinLeaveLabel?: string;
  joinLeaveDisabled?: boolean;
  favoriteDisabled?: boolean;
}

export const EventCard = ({
  event,
  compact = false,
  onPress,
  onToggleFavorite,
  onJoinLeave,
  favoriteLabel,
  joinLeaveLabel,
  joinLeaveDisabled = false,
  favoriteDisabled = false,
}: EventCardProps) => {
  return (
    <Pressable style={[styles.card, event.is_joined && styles.joinedCard]} onPress={onPress}>
      {event.image_url ? (
        <View style={styles.imageBlock} />
      ) : (
        <LinearGradient
          colors={['#1f8a84', '#165f5a', '#c08a37']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, compact && styles.heroCompact]}
        >
          <Ionicons name="sparkles-outline" size={28} color={theme.colors.white} />
          <Text style={styles.heroTitle}>{event.category}</Text>
        </LinearGradient>
      )}

      <View style={styles.content}>
        {event.is_joined ? (
          <View style={styles.joinedNotice}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.primaryDeep} />
            <Text style={styles.joinedNoticeText}>You are already registered</Text>
          </View>
        ) : null}

        <View style={styles.topRow}>
          <View style={styles.topCopy}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.metaText}>{formatDateTime(event.event_date)}</Text>
          </View>
          <StatusBadge status={event.timeline_status || event.status} />
        </View>

        <Text numberOfLines={compact ? 2 : 3} style={styles.description}>
          {event.description || 'No description available.'}
        </Text>

        <View style={styles.metaGrid}>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.metaText}>{event.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.metaText}>
              {event.joined_count ?? 0}/{event.quota}
            </Text>
          </View>
          {event.club?.name ? (
            <View style={styles.metaRow}>
              <Ionicons name="people-circle-outline" size={16} color={theme.colors.textMuted} />
              <Text style={styles.metaText}>{event.club.name}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          {onToggleFavorite ? (
            <SecondaryButton
              title={favoriteLabel || (event.is_favorite ? 'Remove favorite' : 'Favorite')}
              onPress={onToggleFavorite}
              disabled={favoriteDisabled}
            />
          ) : null}
          {onJoinLeave ? (
            <SecondaryButton
              title={joinLeaveLabel || (event.is_joined ? 'Leave' : 'Join')}
              onPress={onJoinLeave}
              disabled={joinLeaveDisabled}
            />
          ) : null}
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
  joinedCard: {
    borderColor: '#b7dfdb',
    backgroundColor: '#f5fcfb',
  },
  hero: {
    minHeight: 150,
    padding: theme.spacing.lg,
    justifyContent: 'flex-end',
    gap: 8,
  },
  heroCompact: {
    minHeight: 120,
  },
  heroTitle: {
    color: theme.colors.white,
    fontFamily: theme.typography.heading,
    fontSize: 22,
  },
  imageBlock: {
    minHeight: 150,
    backgroundColor: theme.colors.surfaceMuted,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  joinedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: '#b7dfdb',
  },
  joinedNoticeText: {
    color: theme.colors.primaryDeep,
    fontFamily: theme.typography.bodyBold,
    fontSize: 13,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  topCopy: {
    flex: 1,
    gap: 4,
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
  metaGrid: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
