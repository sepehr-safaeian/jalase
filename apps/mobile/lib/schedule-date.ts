import { i18n } from '@/i18n';
import { formatClock, formatDayMonth, getDateLocale } from '@/lib/format-date';

export interface GregorianDateParts {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
}

export interface MeetingScheduleParts {
  date: GregorianDateParts;
  hour: number;
  minute: number;
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getCurrentYear(base: Date = new Date()): number {
  return base.getFullYear();
}

export function getDefaultScheduleParts(base: Date = new Date()): MeetingScheduleParts {
  const rounded = new Date(base.getTime() + 30 * MINUTE_MS);
  rounded.setSeconds(0, 0);
  rounded.setMinutes(Math.ceil(rounded.getMinutes() / 5) * 5);

  return dateToScheduleParts(rounded);
}

export function scheduleToDate(parts: MeetingScheduleParts): Date {
  const { year, month, day } = parts.date;
  return new Date(year, month - 1, day, parts.hour, parts.minute, 0, 0);
}

export function dateToScheduleParts(date: Date): MeetingScheduleParts {
  return {
    date: {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    },
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function clampDay(parts: GregorianDateParts): GregorianDateParts {
  const maxDay = daysInMonth(parts.year, parts.month);
  return {
    ...parts,
    day: Math.min(Math.max(1, parts.day), maxDay),
  };
}

export function buildYearOptions(fromYear: number, count = 5): number[] {
  return Array.from({ length: count }, (_, index) => fromYear + index);
}

export function buildMonthOptions(): number[] {
  return Array.from({ length: 12 }, (_, index) => index + 1);
}

export function buildDayOptions(year: number, month: number): number[] {
  const total = daysInMonth(year, month);
  return Array.from({ length: total }, (_, index) => index + 1);
}

export function buildHourOptions(): number[] {
  return Array.from({ length: 24 }, (_, index) => index);
}

export function buildMinuteOptions(step = 5): number[] {
  return Array.from({ length: 60 / step }, (_, index) => index * step);
}

/** "Oct 16" (en) */
export function formatScheduleDateField(day: number, month: number): string {
  return formatDayMonth(day, month);
}

/** "6:20 PM" (en) */
export function formatScheduleTimeField(hour: number, minute: number): string {
  return formatClock(hour, minute);
}

/** "Today, 6:20 PM" / "Tomorrow, 6:20 PM" / "Oct 16, 6:20 PM" */
export function formatUpcomingScheduleLabel(iso: string): string {
  const target = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const dayDiff = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / DAY_MS,
  );

  const time = formatClock(target.getHours(), target.getMinutes());
  const separator = getDateLocale() === 'fa' ? '، ' : ', ';

  if (dayDiff === 0) return `${i18n.t('common.today')}${separator}${time}`;
  if (dayDiff === 1) return `${i18n.t('common.tomorrow')}${separator}${time}`;

  const dateLabel = formatDayMonth(target.getDate(), target.getMonth() + 1);
  return `${dateLabel}${separator}${time}`;
}

export function isScheduleInFuture(parts: MeetingScheduleParts, now = new Date()): boolean {
  return scheduleToDate(parts).getTime() > now.getTime();
}
