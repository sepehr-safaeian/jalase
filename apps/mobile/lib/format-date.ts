import {
  DEFAULT_LOCALE,
  getIntlLocale,
  type AppLocale,
} from '@jalase/shared';
import { i18n } from '@/i18n';

let activeLocale: AppLocale = DEFAULT_LOCALE;

/** Sync formatter locale with the active app language */
export function setDateLocale(locale: AppLocale): void {
  activeLocale = locale;
}

export function getDateLocale(): AppLocale {
  return activeLocale;
}

/**
 * Intl locale tag for the app locale.
 * Always Gregorian calendar + Latin digits, regardless of language.
 */
export function getCalendarIntlLocale(locale: AppLocale = activeLocale): string {
  return `${getIntlLocale(locale)}-u-ca-gregory-nu-latn`;
}

/** Latin-digit integer, optionally zero padded */
export function formatNumber(value: number, minDigits = 1): string {
  return new Intl.NumberFormat('en-US', {
    useGrouping: false,
    minimumIntegerDigits: minDigits,
  }).format(value);
}

/** Gregorian month name (month is 1-12) in the active locale */
export function formatMonthName(
  month: number,
  style: 'long' | 'short' = 'long',
  locale: AppLocale = activeLocale,
): string {
  return new Intl.DateTimeFormat(getCalendarIntlLocale(locale), {
    month: style,
  }).format(new Date(2000, month - 1, 1));
}

/** "Oct 16" (en) or "16 اکتبر" (fa) for a Gregorian day and month */
export function formatDayMonth(
  day: number,
  month: number,
  locale: AppLocale = activeLocale,
): string {
  return new Intl.DateTimeFormat(getCalendarIntlLocale(locale), {
    day: 'numeric',
    month: 'short',
  }).format(new Date(2000, month - 1, day));
}

/** Hour wheel label: "6 PM" (en) or "18" (fa) */
export function formatHourLabel(
  hour: number,
  locale: AppLocale = activeLocale,
): string {
  if (locale === 'fa') return formatNumber(hour, 2);

  return new Intl.DateTimeFormat(getCalendarIntlLocale(locale), {
    hour: 'numeric',
    hour12: true,
  }).format(new Date(2000, 0, 1, hour, 0));
}

/** Clock label for hour and minute: "6:20 PM" (en) or "18:20" (fa) */
export function formatClock(
  hour: number,
  minute: number,
  locale: AppLocale = activeLocale,
): string {
  return new Intl.DateTimeFormat(getCalendarIntlLocale(locale), {
    hour: locale === 'fa' ? '2-digit' : 'numeric',
    minute: '2-digit',
    hour12: locale !== 'fa',
  }).format(new Date(2000, 0, 1, hour, minute));
}

export function formatDateParts(iso: string | null | undefined): {
  day: string;
  month: string;
} {
  if (!iso) {
    return { day: '-', month: '-' };
  }

  const date = new Date(iso);
  const intl = getCalendarIntlLocale(activeLocale);
  const day = new Intl.DateTimeFormat(intl, { day: 'numeric' }).format(date);
  const month = new Intl.DateTimeFormat(intl, { month: 'long' }).format(date);

  return { day, month };
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';

  return new Intl.DateTimeFormat(getCalendarIntlLocale(activeLocale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '-';

  return new Intl.DateTimeFormat(getCalendarIntlLocale(activeLocale), {
    hour: activeLocale === 'fa' ? '2-digit' : 'numeric',
    minute: '2-digit',
    hour12: activeLocale !== 'fa',
  }).format(new Date(iso));
}

export function formatRelativeMeetingLabel(
  iso: string | null | undefined,
  labels?: { noDate: string; today: string },
): string {
  const noDate = labels?.noDate ?? i18n.t('common.noDate');
  const todayLabel = labels?.today ?? i18n.t('common.today');

  if (!iso) return noDate;

  const target = new Date(iso);
  const today = new Date();
  const sameDay =
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth() &&
    target.getDate() === today.getDate();

  if (sameDay) return todayLabel;

  return formatDateTime(iso);
}

/** @deprecated Use formatDateParts */
export const formatPersianDateParts = formatDateParts;
/** @deprecated Use formatDateTime */
export const formatPersianDateTime = formatDateTime;
/** @deprecated Use formatTime */
export const formatPersianTime = formatTime;
