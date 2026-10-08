import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  DEFAULT_LOCALE,
  getTextDirection,
  isAppLocale,
  type AppLocale,
} from '@jalase/shared';
import { I18nManager, Platform } from 'react-native';
import en from './locales/en.json';
import fa from './locales/fa.json';

export const resources = {
  en: { translation: en },
  fa: { translation: fa },
} as const;

const WEB_DIR_STYLE_ID = 'jalase-doc-direction';

let initialized = false;

export function initI18n(locale: AppLocale = DEFAULT_LOCALE): typeof i18n {
  if (!initialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      compatibilityJSON: 'v4',
      interpolation: { escapeValue: false },
      returnNull: false,
    });
    initialized = true;
  } else if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }

  return i18n;
}

function applyWebDocumentDirection(locale: AppLocale, shouldRtl: boolean): void {
  if (typeof document === 'undefined') return;

  const dir = shouldRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
  document.body?.setAttribute('dir', dir);
  document.body?.setAttribute('lang', locale);

  // RN-web ignores the `direction` style prop; force CSS direction on the document.
  let styleTag = document.getElementById(WEB_DIR_STYLE_ID) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = WEB_DIR_STYLE_ID;
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `
    html, body, #root, #__next {
      direction: ${dir} !important;
    }
  `;
}

/** Apply locale layout. Returns true if a native restart is required. */
export function applyLayoutDirection(locale: AppLocale): boolean {
  const shouldRtl = getTextDirection(locale) === 'rtl';
  const needsNativeRestart =
    Platform.OS !== 'web' && I18nManager.isRTL !== shouldRtl;

  // Always allow RTL capability, then force the active direction.
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(shouldRtl);

  if (Platform.OS === 'web') {
    applyWebDocumentDirection(locale, shouldRtl);
  }

  return needsNativeRestart;
}

export function resolveInitialLocale(stored?: string | null): AppLocale {
  if (isAppLocale(stored)) {
    return stored;
  }
  return DEFAULT_LOCALE;
}

export { i18n };
export type { AppLocale };
