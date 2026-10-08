import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  DEFAULT_LOCAL_PREFERENCES,
  isAppLocale,
  type AppLocale,
  type FontSizePreference,
  type LocalAppPreferences,
  type ThemePreference,
} from '@jalase/shared';

const STORAGE_KEY = 'jalase_app_preferences';

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark';
}

function isFontSizePreference(value: unknown): value is FontSizePreference {
  return value === 'small' || value === 'medium' || value === 'large';
}

function parsePreferences(raw: string | null): LocalAppPreferences {
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

export async function loadLocalPreferences(): Promise<LocalAppPreferences> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_LOCAL_PREFERENCES;
    }
    return parsePreferences(localStorage.getItem(STORAGE_KEY));
  }

  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  return parsePreferences(raw);
}

export async function saveLocalPreferences(
  preferences: LocalAppPreferences,
): Promise<void> {
  const payload = JSON.stringify(preferences);

  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, payload);
    return;
  }

  await SecureStore.setItemAsync(STORAGE_KEY, payload);
}

export type { AppLocale };
