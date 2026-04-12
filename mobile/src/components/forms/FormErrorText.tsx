import { StyleSheet, Text } from 'react-native';

import { theme } from '../../constants/theme';

interface FormErrorTextProps {
  message?: string;
}

export const FormErrorText = ({ message }: FormErrorTextProps) => {
  if (!message) {
    return null;
  }

  return <Text style={styles.text}>{message}</Text>;
};

const styles = StyleSheet.create({
  text: {
    color: theme.colors.danger,
    fontFamily: theme.typography.bodySemiBold,
    fontSize: 13,
    marginTop: 6,
  },
});
