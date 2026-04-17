import type { Theme } from '@react-navigation/native';

const palette = {
  background: '#f7f2ea',
  backgroundMuted: '#efe7db',
  surface: '#fffaf4',
  surfaceStrong: '#ffffff',
  surfaceMuted: '#f4ede2',
  border: '#e0d3c2',
  borderStrong: '#c9b69d',
  text: '#1f2c30',
  textMuted: '#5f6f73',
  textSoft: '#8b999d',
  primary: '#1f8a84',
  primaryDeep: '#165f5a',
  primarySoft: '#dff4f2',
  accent: '#c08a37',
  accentSoft: '#f7ebd4',
  danger: '#c05656',
  dangerSoft: '#fde9e9',
  success: '#2f7d5b',
  successSoft: '#e2f4ea',
  warning: '#b67a1d',
  warningSoft: '#faefda',
  overlay: 'rgba(21, 33, 38, 0.44)',
  shadow: '#0f1f23',
  white: '#ffffff',
} as const;

export const theme = {
  colors: palette,
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    pill: 999,
  },
  typography: {
    heading: 'SpaceGrotesk_700Bold',
    body: 'SourceSans3_400Regular',
    bodySemiBold: 'SourceSans3_600SemiBold',
    bodyBold: 'SourceSans3_700Bold',
  },
  shadow: {
    card: {
      shadowColor: palette.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    floating: {
      shadowColor: palette.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  },
} as const;

export const navigationTheme: Theme = {
  dark: false,
  colors: {
    primary: palette.primary,
    background: palette.background,
    card: palette.surfaceStrong,
    text: palette.text,
    border: palette.border,
    notification: palette.accent,
  },
  fonts: {
    regular: {
      fontFamily: theme.typography.body,
      fontWeight: '400',
    },
    medium: {
      fontFamily: theme.typography.bodySemiBold,
      fontWeight: '500',
    },
    bold: {
      fontFamily: theme.typography.heading,
      fontWeight: '700',
    },
    heavy: {
      fontFamily: theme.typography.heading,
      fontWeight: '800',
    },
  },
};

export type ThemeColors = typeof palette;
