import { describe, expect, it } from 'vitest';
import {
  addLocalDays,
  getLocalDayStart,
  getMeetingBucketRange,
} from './meeting-buckets.js';

const TZ = 210;

describe('meeting-buckets', () => {
  it('computes local day start for Tehran offset', () => {
    const now = new Date('2026-08-31T10:00:00.000Z');
    const start = getLocalDayStart(now, TZ);
    expect(start.toISOString()).toBe('2026-08-30T20:30:00.000Z');
  });

  it('places upcoming meeting in today bucket', () => {
    const now = new Date('2026-08-31T10:00:00.000Z');
    const range = getMeetingBucketRange('today', now, TZ);
    const meeting = new Date('2026-08-31T12:00:00.000Z');
    expect(meeting.getTime()).toBeGreaterThanOrEqual(range.start.getTime());
    expect(meeting.getTime()).toBeLessThan(range.end!.getTime());
  });

  it('moves same-day past meeting out of today bucket', () => {
    const now = new Date('2026-08-31T10:00:00.000Z');
    const todayRange = getMeetingBucketRange('today', now, TZ);
    const pastRange = getMeetingBucketRange('past', now, TZ);
    const meeting = new Date('2026-08-31T06:00:00.000Z');

    expect(meeting.getTime()).toBeLessThan(todayRange.start.getTime());
    expect(meeting.getTime()).toBeGreaterThanOrEqual(pastRange.start.getTime());
    expect(meeting.getTime()).toBeLessThan(pastRange.end!.getTime());
  });

  it('past bucket ends at now', () => {
    const now = new Date('2026-08-31T10:00:00.000Z');
    const past = getMeetingBucketRange('past', now, TZ);
    expect(past.end!.getTime()).toBe(now.getTime());
  });

  it('next_week starts day after tomorrow', () => {
    const now = new Date('2026-08-31T10:00:00.000Z');
    const tomorrow = getMeetingBucketRange('tomorrow', now, TZ);
    const nextWeek = getMeetingBucketRange('next_week', now, TZ);
    expect(nextWeek.start.getTime()).toBe(tomorrow.end!.getTime());
    expect(nextWeek.end!.getTime()).toBe(
      addLocalDays(getLocalDayStart(now, TZ), 7, TZ).getTime(),
    );
  });
});
