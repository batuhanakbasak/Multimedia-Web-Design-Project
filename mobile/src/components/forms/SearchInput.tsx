import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { theme } from '../../constants/theme';

interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput = ({
  value,
  placeholder = 'Ara...',
  onChangeText,
  onClear,
}: SearchInputProps) => {
  return (
    <View style={styles.wrapper}>
      <Ionicons name="search-outline" size={20} color={theme.colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSoft}
        returnKeyType="search"
      />
      {value ? (
        <Pressable onPress={onClear} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color={theme.colors.textSoft} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 52,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.typography.body,
    fontSize: 16,
  },
});
