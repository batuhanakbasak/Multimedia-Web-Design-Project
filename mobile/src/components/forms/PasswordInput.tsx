import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { theme } from '../../constants/theme';

import { FormErrorText } from './FormErrorText';

interface PasswordInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const PasswordInput = ({ label, error, style, ...props }: PasswordInputProps) => {
  const [secure, setSecure] = useState(true);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, error && styles.errorInput]}>
        <TextInput
          secureTextEntry={secure}
          placeholderTextColor={theme.colors.textSoft}
          style={[styles.input, style]}
          {...props}
        />
        <Pressable onPress={() => setSecure((previous) => !previous)} style={styles.iconButton}>
          <Ionicons
            name={secure ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </View>
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
  inputWrapper: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: theme.typography.body,
    fontSize: 16,
  },
  iconButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorInput: {
    borderColor: theme.colors.danger,
  },
});
