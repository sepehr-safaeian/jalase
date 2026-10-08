import { DEFAULT_LOCALE, type AppLocale } from '../i18n/types.js';

export type ThemePreference = 'light' | 'dark';

export type FontSizePreference = 'small' | 'medium' | 'large';

export interface LocalAppPreferences {
  theme: ThemePreference;
  fontSize: FontSizePreference;
  locale: AppLocale;
}

export interface UpdateUserSettingsRequest {
  aiDataSharingConsent: boolean;
}

export const DEFAULT_LOCAL_PREFERENCES: LocalAppPreferences = {
  theme: 'light',
  fontSize: 'medium',
  locale: DEFAULT_LOCALE,
};

export const FONT_SCALE: Record<FontSizePreference, number> = {
  small: 0.9,
  medium: 1,
  large: 1.12,
};
