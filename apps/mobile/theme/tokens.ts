export type ColorScheme = 'light' | 'dark';

export const palette = {
  canvas: '#F7F7F2',
  surface: '#FFFFFF',
  surfaceSoft: '#EAEAE5',
  ink: '#0E0F0C',
  inkSoft: '#454745',
  inkMuted: '#72726E',
  inkQuiet: '#818179',
  green900: '#187A45',
  green700: '#22A35D',
  green400: '#5FD693',
  green100: '#D9F5E6',
  yellow: '#FEBE29',
  pink: '#FF91E0',
  purple: '#CEBEF8',
  border: '#E3E3E3',
  borderStrong: '#D5D5D2',
  error: '#B42318',
} as const;

export const colors = {
  light: {
    canvas: palette.canvas,
    background: palette.canvas,
    surface: palette.surface,
    surfaceSoft: palette.surfaceSoft,
    text: palette.ink,
    textBody: palette.ink,
    textSecondary: palette.inkSoft,
    textMuted: palette.inkMuted,
    textQuiet: palette.inkQuiet,
    primary: palette.green900,
    primaryMid: palette.green700,
    primarySoft: palette.green400,
    primaryTint: palette.green100,
    primaryText: '#FFFFFF',
    accent: palette.green700,
    highlight: palette.yellow,
    border: palette.border,
    borderStrong: palette.borderStrong,
    error: palette.error,
    expressive: {
      yellow: palette.yellow,
      pink: palette.pink,
      purple: palette.purple,
    },
  },
  dark: {
    canvas: '#1A1A18',
    background: '#1A1A18',
    surface: '#242422',
    surfaceSoft: '#2E2E2C',
    text: '#F7F7F2',
    textBody: '#F7F7F2',
    textSecondary: '#B8B8B2',
    textMuted: '#8A8A84',
    textQuiet: '#72726E',
    primary: palette.green400,
    primaryMid: '#3DB87A',
    primarySoft: '#2A8F5C',
    primaryTint: '#1A3D2A',
    primaryText: palette.ink,
    accent: palette.green400,
    highlight: palette.yellow,
    border: '#3A3A38',
    borderStrong: '#4A4A48',
    error: '#F97066',
    expressive: {
      yellow: palette.yellow,
      pink: palette.pink,
      purple: palette.purple,
    },
  },
} as const;

export type ThemeColors = (typeof colors)[ColorScheme];

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  section: 64,
  cardPadding: 24,
  elementGap: 16,
} as const;

export const layout = {
  maxWidth: 1200,
} as const;
