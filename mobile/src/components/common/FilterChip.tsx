import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../../constants/theme';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export const FilterChip = ({ label, active = false, onPress }: FilterChipProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.activeChip,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
  },
  activeChip: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: '#b8e2de',
  },
  label: {
    color: theme.colors.text,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
  },
  activeLabel: {
    color: theme.colors.primaryDeep,
  },
  pressed: {
    opacity: 0.9,
  },
});
