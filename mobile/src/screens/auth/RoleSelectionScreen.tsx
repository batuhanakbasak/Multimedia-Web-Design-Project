import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { AUTH_ROUTES, type AuthStackParamList } from '../../constants/routes';
import { theme } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'RoleSelection'>;

export const RoleSelectionScreen = ({ navigation }: Props) => {
  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#10262d', '#1f4f55']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.eyebrow}>Campus Event System</Text>
        <Text style={styles.heroTitle}>One app, two role-based flows.</Text>
        <Text style={styles.heroText}>
          Students discover events while organizers manage the campus activity stream.
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.title}>How would you like to continue?</Text>
        <Text style={styles.description}>
          After signing in, the correct panel opens automatically based on your role.
        </Text>

        <View style={styles.buttonGroup}>
          <PrimaryButton
            title="Continue as Student"
            onPress={() => navigation.navigate(AUTH_ROUTES.StudentLogin)}
          />
          <SecondaryButton
            title="Continue as Organizer"
            onPress={() => navigation.navigate(AUTH_ROUTES.OrganizerLogin)}
          />
          <SecondaryButton
            title="Create Student Account"
            onPress={() => navigation.navigate(AUTH_ROUTES.StudentRegister)}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  hero: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  eyebrow: {
    color: '#cbe9e6',
    fontFamily: theme.typography.bodyBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: theme.colors.white,
    fontFamily: theme.typography.heading,
    fontSize: 34,
  },
  heroText: {
    color: '#dfefed',
    fontFamily: theme.typography.body,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    ...theme.shadow.card,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.typography.heading,
    fontSize: 26,
  },
  description: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  buttonGroup: {
    gap: theme.spacing.md,
  },
});
