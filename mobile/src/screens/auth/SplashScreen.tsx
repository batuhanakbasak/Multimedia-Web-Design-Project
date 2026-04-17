import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenContainer } from '../../components/common/ScreenContainer';
import { LoadingView } from '../../components/common/LoadingView';
import { theme } from '../../constants/theme';

export const SplashScreen = () => {
  return (
    <ScreenContainer scroll={false} withPadding={false}>
      <LinearGradient
        colors={['#f7f2ea', '#efe7db', '#dff4f2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>GM</Text>
        </View>
        <Text style={styles.title}>Gadsum Mobile</Text>
        <Text style={styles.subtitle}>Preparing your event experience.</Text>
        <LoadingView variant="inline" message="Verifying session..." />
      </LinearGradient>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: theme.colors.white,
    fontFamily: theme.typography.heading,
    fontSize: 32,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 34,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 16,
  },
});
