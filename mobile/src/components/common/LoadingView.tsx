import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

interface LoadingViewProps {
  message?: string;
  variant?: 'screen' | 'inline' | 'cards';
}

export const LoadingView = ({
  message = 'Loading...',
  variant = 'screen',
}: LoadingViewProps) => {
  if (variant === 'cards') {
    return (
      <View style={styles.cardsContainer}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={styles.cardSkeleton}>
            <View style={styles.bannerSkeleton} />
            <View style={styles.lineLarge} />
            <View style={styles.lineSmall} />
            <View style={styles.lineTiny} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={variant === 'screen' ? styles.screen : styles.inline}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
  },
  message: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 15,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: theme.spacing.lg,
  },
  cardSkeleton: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  bannerSkeleton: {
    height: 150,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
  lineLarge: {
    width: '68%',
    height: 20,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceMuted,
  },
  lineSmall: {
    width: '88%',
    height: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceMuted,
  },
  lineTiny: {
    width: '52%',
    height: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceMuted,
  },
});
