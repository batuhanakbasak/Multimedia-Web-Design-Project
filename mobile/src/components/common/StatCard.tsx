import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

interface StatCardProps {
  label: string;
  value: number | string;
  tone?: 'primary' | 'accent' | 'neutral';
}

export const StatCard = ({ label, value, tone = 'primary' }: StatCardProps) => {
  const colors =
    tone === 'accent'
      ? {
          backgroundColor: theme.colors.accentSoft,
          valueColor: theme.colors.accent,
        }
      : tone === 'neutral'
        ? {
            backgroundColor: theme.colors.surfaceStrong,
            valueColor: theme.colors.text,
          }
        : {
            backgroundColor: theme.colors.primarySoft,
            valueColor: theme.colors.primaryDeep,
          };

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundColor }]}>
      <Text style={[styles.value, { color: colors.valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  value: {
    fontFamily: theme.typography.heading,
    fontSize: 28,
  },
  label: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
  },
});
