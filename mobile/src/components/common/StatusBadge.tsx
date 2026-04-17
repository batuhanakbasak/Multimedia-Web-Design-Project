import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';
import { getStatusColor, getStatusLabel } from '../../utils/formatDate';

interface StatusBadgeProps {
  status?: string | null;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const colors = getStatusColor(status);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.color }]}>{getStatusLabel(status)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontFamily: theme.typography.bodyBold,
  },
});
