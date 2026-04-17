import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const SectionHeader = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 22,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 15,
  },
  action: {
    color: theme.colors.primaryDeep,
    fontFamily: theme.typography.bodyBold,
    fontSize: 14,
  },
});
