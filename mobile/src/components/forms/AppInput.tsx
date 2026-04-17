import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { theme } from '../../constants/theme';

import { FormErrorText } from './FormErrorText';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const AppInput = ({ label, error, style, ...props }: AppInputProps) => {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textSoft}
        style={[styles.input, error && styles.errorInput, style]}
        {...props}
      />
      <FormErrorText message={error} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  label: {
    color: theme.colors.text,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 14,
  },
  input: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: theme.typography.body,
    fontSize: 16,
  },
  errorInput: {
    borderColor: theme.colors.danger,
  },
});
