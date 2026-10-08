import type { NoteSummary } from './types.js';

/** آفست زمانی ایران (UTC+3:30) — پیش‌فرض وقتی کلاینت offset نفرستد */
export const TEHRAN_TZ_OFFSET_MINUTES = 210;

export const MEETING_LIST_DEFAULT_LIMIT = 30;
export const MEETING_LIST_PAST_LIMIT = 20;
export const MEETING_LIST_MAX_LIMIT = 50;

export type MeetingBucket = 'today' | 'tomorrow' | 'next_week' | 'past';

export interface MeetingListCursor {
  meetingDate: string;
  id: string;
}

export interface MeetingListQuery {
  bucket: MeetingBucket;
  cursor?: string | null;
  limit?: number;
  /** دقیقه نسبت به UTC؛ مثل `-new Date().getTimezoneOffset()` مرورگر */
  tzOffsetMinutes?: number;
}

export interface MeetingListResponse {
  items: NoteSummary[];
  nextCursor: string | null;
  bucket: MeetingBucket;
  hasMore: boolean;
}

export const MEETING_BUCKET_LABELS: Record<MeetingBucket, string> = {
  today: 'امروز',
  tomorrow: 'فردا',
  next_week: 'هفته آینده',
  past: 'گذشته',
};
