import {
  DEFAULT_LOCAL_PREFERENCES,
  isAppLocale,
  type FontSizePreference,
  type LocalAppPreferences,
  type ThemePreference,
} from '@jalase/shared';

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark';
}

function isFontSizePreference(value: unknown): value is FontSizePreference {
  return value === 'small' || value === 'medium' || value === 'large';
}

export function parsePreferencesForTest(
  raw: string | null,
): LocalAppPreferences {
  if (!raw) {
    return DEFAULT_LOCAL_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalAppPreferences>;
    return {
      theme: isThemePreference(parsed.theme)
        ? parsed.theme
        : DEFAULT_LOCAL_PREFERENCES.theme,
      fontSize: isFontSizePreference(parsed.fontSize)
        ? parsed.fontSize
        : DEFAULT_LOCAL_PREFERENCES.fontSize,
      locale: isAppLocale(parsed.locale)
        ? parsed.locale
        : DEFAULT_LOCAL_PREFERENCES.locale,
    };
  } catch {
    return DEFAULT_LOCAL_PREFERENCES;
  }
}
