import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCAL_PREFERENCES,
  FONT_SCALE,
  getTextDirection,
  type AppLocale,
  type FontSizePreference,
  type ThemePreference,
} from '@jalase/shared';
import { I18nextProvider } from 'react-i18next';
import {
  applyLayoutDirection,
  initI18n,
  i18n,
} from '@/i18n';
import { setDateLocale } from '@/lib/format-date';
import {
  loadLocalPreferences,
  saveLocalPreferences,
} from '@/lib/settings/settings-storage';
import { colors, type ColorScheme, type ThemeColors } from './tokens';

interface SettingsContextValue {
  scheme: ColorScheme;
  colors: ThemeColors;
  themePreference: ThemePreference;
  fontSize: FontSizePreference;
  fontScale: number;
  locale: AppLocale;
  isRtl: boolean;
  isHydrated: boolean;
  setThemePreference: (theme: ThemePreference) => Promise<void>;
  setFontSize: (size: FontSizePreference) => Promise<void>;
  setLocale: (locale: AppLocale) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    DEFAULT_LOCAL_PREFERENCES.theme,
  );
  const [fontSize, setFontSizeState] = useState<FontSizePreference>(
    DEFAULT_LOCAL_PREFERENCES.fontSize,
  );
  const [locale, setLocaleState] = useState<AppLocale>(
    DEFAULT_LOCAL_PREFERENCES.locale,
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    void loadLocalPreferences().then((prefs) => {
      setThemePreferenceState(prefs.theme);
      setFontSizeState(prefs.fontSize);
      setLocaleState(prefs.locale);
      initI18n(prefs.locale);
      setDateLocale(prefs.locale);
      applyLayoutDirection(prefs.locale);
      setIsHydrated(true);
    });
  }, []);

  // Re-apply document direction after hydration (Expo web may reset html dir).
  useEffect(() => {
    if (!isHydrated) return;
    applyLayoutDirection(locale);
    setDateLocale(locale);
  }, [isHydrated, locale]);

  const persist = useCallback(
    async (
      nextTheme: ThemePreference,
      nextFontSize: FontSizePreference,
      nextLocale: AppLocale,
    ) => {
      await saveLocalPreferences({
        theme: nextTheme,
        fontSize: nextFontSize,
        locale: nextLocale,
      });
    },
    [],
  );

  const setThemePreference = useCallback(
    async (theme: ThemePreference) => {
      setThemePreferenceState(theme);
      await persist(theme, fontSize, locale);
    },
    [fontSize, locale, persist],
  );

  const setFontSize = useCallback(
    async (size: FontSizePreference) => {
      setFontSizeState(size);
      await persist(themePreference, size, locale);
    },
    [themePreference, locale, persist],
  );

  const setLocale = useCallback(
    async (next: AppLocale) => {
      setLocaleState(next);
      initI18n(next);
      setDateLocale(next);
      await i18n.changeLanguage(next);
      const needsRestart = applyLayoutDirection(next);
      await persist(themePreference, fontSize, next);
      return needsRestart;
    },
    [themePreference, fontSize, persist],
  );

  const scheme: ColorScheme = themePreference;
  const fontScale = FONT_SCALE[fontSize];
  const isRtl = getTextDirection(locale) === 'rtl';

  const value = useMemo<SettingsContextValue>(
    () => ({
      scheme,
      colors: colors[scheme],
      themePreference,
      fontSize,
      fontScale,
      locale,
      isRtl,
      isHydrated,
      setThemePreference,
      setFontSize,
      setLocale,
    }),
    [
      scheme,
      themePreference,
      fontSize,
      fontScale,
      locale,
      isRtl,
      isHydrated,
      setThemePreference,
      setFontSize,
      setLocale,
    ],
  );

  if (!isHydrated) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
    </I18nextProvider>
  );
}

export function useTheme() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return {
    scheme: ctx.scheme,
    colors: ctx.colors,
  };
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within ThemeProvider');
  }

  return ctx;
}

export function useIsRtl() {
  return useSettings().isRtl;
}
