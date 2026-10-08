import { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontSize: 68,
    lineHeight: 68,
    letterSpacing: -1.02,
  },
  headingLg: {
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.48,
  },
  heading: {
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.36,
  },
  headingMd: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.12,
  },
  headingSm: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0.18,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.16,
  },
  small: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.15,
  },
  ui: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  uiSm: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.13,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const displayVariants: TypographyVariant[] = [
  'display',
  'headingLg',
  'heading',
  'headingMd',
];

export function isDisplayVariant(variant: TypographyVariant): boolean {
  return displayVariants.includes(variant);
}
