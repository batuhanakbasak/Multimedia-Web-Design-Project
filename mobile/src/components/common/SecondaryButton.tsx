import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '../../constants/theme';

interface SecondaryButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SecondaryButton = ({
  title,
  fullWidth = true,
  disabled,
  style,
  ...props
}: SecondaryButtonProps) => {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    color: theme.colors.text,
    fontFamily: theme.typography.bodyBold,
    fontSize: 16,
  },
  pressed: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  disabled: {
    opacity: 0.6,
  },
});
