import type { MeetingBucket, MeetingListQuery, MeetingListResponse } from '@jalase/shared';
import { apiRequest } from './client';
import { getAccessToken } from '@/lib/auth/token-storage';

async function token() {
  const t = await getAccessToken();
  if (!t) throw new Error('نشست منقضی شده است');
  return t;
}

export async function listMeetingsByBucket(
  params: MeetingListQuery,
): Promise<MeetingListResponse> {
  const search = new URLSearchParams();
  search.set('bucket', params.bucket);
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.tzOffsetMinutes !== undefined) {
    search.set('tzOffsetMinutes', String(params.tzOffsetMinutes));
  }

  return apiRequest<MeetingListResponse>(`/notes/meetings?${search.toString()}`, {
    token: await token(),
  });
}

export function getClientTzOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export type { MeetingBucket, MeetingListResponse };
