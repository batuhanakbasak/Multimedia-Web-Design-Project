import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '../../constants/theme';

interface PrimaryButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const PrimaryButton = ({
  title,
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...props
}: PrimaryButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.white} />
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadow.floating,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    color: theme.colors.white,
    fontFamily: theme.typography.bodyBold,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.65,
  },
});
