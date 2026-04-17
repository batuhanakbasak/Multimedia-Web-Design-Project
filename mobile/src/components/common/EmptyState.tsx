import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

import { SecondaryButton } from './SecondaryButton';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const EmptyState = ({
  title,
  message,
  actionLabel,
  onActionPress,
}: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotSecondary]} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onActionPress ? (
        <SecondaryButton title={actionLabel} onPress={onActionPress} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceStrong,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mark: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  dotSecondary: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 22,
    textAlign: 'center',
  },
  message: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
