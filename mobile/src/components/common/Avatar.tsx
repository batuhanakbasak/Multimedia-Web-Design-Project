import { Image, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../constants/theme';

interface AvatarProps {
  name?: string;
  uri?: string | null;
  size?: number;
}

const getInitials = (name?: string) => {
  if (!name) {
    return 'GM';
  }

  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
};

export const Avatar = ({ name, uri, size = 56 }: AvatarProps) => {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.28 }]}>{getInitials(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  initials: {
    color: theme.colors.white,
    fontFamily: theme.typography.heading,
  },
});
