import type { ReactElement, ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  type RefreshControlProps,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { theme } from '../../constants/theme';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  withPadding?: boolean;
  footer?: ReactNode;
  contentContainerStyle?: object;
  refreshControl?: ReactElement<RefreshControlProps> | null;
}

export const ScreenContainer = ({
  children,
  scroll = true,
  withPadding = true,
  footer,
  contentContainerStyle,
  refreshControl,
}: ScreenContainerProps) => {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        withPadding && styles.paddedContent,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl || undefined}
      showsVerticalScrollIndicator={false}
    >
      {children}
      {footer}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, withPadding && styles.paddedContent, contentContainerStyle]}>
      {children}
      {footer}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {content}
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  staticContent: {
    flex: 1,
    paddingBottom: theme.spacing.xxl,
  },
  paddedContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
});
