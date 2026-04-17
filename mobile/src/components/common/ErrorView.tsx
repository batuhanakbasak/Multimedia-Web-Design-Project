import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

import { PrimaryButton } from './PrimaryButton';

interface ErrorViewProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export const ErrorView = ({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try again',
  onRetry,
}: ErrorViewProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <PrimaryButton title={retryLabel} onPress={onRetry} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#f1d0d0',
    backgroundColor: theme.colors.dangerSoft,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.danger,
    fontFamily: theme.typography.heading,
    fontSize: 20,
  },
  message: {
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
