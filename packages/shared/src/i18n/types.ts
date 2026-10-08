export type AppLocale = 'en' | 'fa';

export type TextDirection = 'ltr' | 'rtl';

export const APP_LOCALES: readonly AppLocale[] = ['en', 'fa'] as const;

export const DEFAULT_LOCALE: AppLocale = 'en';

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'en' || value === 'fa';
}

export function getTextDirection(locale: AppLocale): TextDirection {
  return locale === 'fa' ? 'rtl' : 'ltr';
}

export function getIntlLocale(locale: AppLocale): string {
  return locale === 'fa' ? 'fa-IR' : 'en-US';
}
