import type { MeetingBucket } from './meeting-list-types.js';
import { TEHRAN_TZ_OFFSET_MINUTES } from './meeting-list-types.js';

export interface MeetingBucketRange {
  /** inclusive for future buckets */
  start: Date;
  /** exclusive upper bound; null = بدون سقف (فقط past از startToday استفاده می‌کند) */
  end: Date | null;
}

/** شروع روز تقویمی محلی کاربر (نیمه‌شب محلی به UTC) */
export function getLocalDayStart(
  now: Date,
  tzOffsetMinutes: number = TEHRAN_TZ_OFFSET_MINUTES,
): Date {
  const shiftedMs = now.getTime() + tzOffsetMinutes * 60_000;
  const shifted = new Date(shiftedMs);
  const utcMidnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  return new Date(utcMidnight - tzOffsetMinutes * 60_000);
}

export function addLocalDays(
  anchor: Date,
  days: number,
  tzOffsetMinutes: number = TEHRAN_TZ_OFFSET_MINUTES,
): Date {
  const shiftedMs = anchor.getTime() + tzOffsetMinutes * 60_000;
  const shifted = new Date(shiftedMs);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  const utcMidnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  return new Date(utcMidnight - tzOffsetMinutes * 60_000);
}

/** بازه `meeting_date` برای هر تب (end exclusive)
 *  امروز = فقط جلسات آیندهِ باقی‌مانده از امروز (از الان تا نیمه‌شب)
 *  گذشته = هر جلسه‌ای که زمانش گذشته (شامل امروزِ قبل از الان)
 */
export function getMeetingBucketRange(
  bucket: MeetingBucket,
  now: Date = new Date(),
  tzOffsetMinutes: number = TEHRAN_TZ_OFFSET_MINUTES,
): MeetingBucketRange {
  const startToday = getLocalDayStart(now, tzOffsetMinutes);
  const startTomorrow = addLocalDays(startToday, 1, tzOffsetMinutes);
  const startDayAfterTomorrow = addLocalDays(startToday, 2, tzOffsetMinutes);
  const startWeekHorizon = addLocalDays(startToday, 7, tzOffsetMinutes);

  switch (bucket) {
    case 'today':
      return { start: now, end: startTomorrow };
    case 'tomorrow':
      return { start: startTomorrow, end: startDayAfterTomorrow };
    case 'next_week':
      return { start: startDayAfterTomorrow, end: startWeekHorizon };
    case 'past':
      return { start: new Date(0), end: now };
    default: {
      const _exhaustive: never = bucket;
      return _exhaustive;
    }
  }
}

export function isMeetingBucketPaginated(bucket: MeetingBucket): boolean {
  return bucket === 'past';
}
