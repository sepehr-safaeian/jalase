import type { MeetingBucket, MeetingListResponse } from '@jalase/shared';

export interface MeetingsCacheEntry {
  bucket: MeetingBucket;
  tzOffsetMinutes: number;
  items: MeetingListResponse['items'];
  nextCursor: string | null;
  hasMore: boolean;
  updatedAt: number;
}

const memory = new Map<string, MeetingsCacheEntry>();

function cacheKey(bucket: MeetingBucket, tzOffsetMinutes: number): string {
  return `${bucket}:${tzOffsetMinutes}`;
}

export async function readMeetingsCache(
  bucket: MeetingBucket,
  tzOffsetMinutes: number,
): Promise<MeetingsCacheEntry | null> {
  return memory.get(cacheKey(bucket, tzOffsetMinutes)) ?? null;
}

export async function writeMeetingsCache(entry: MeetingsCacheEntry): Promise<void> {
  memory.set(cacheKey(entry.bucket, entry.tzOffsetMinutes), entry);
}

export async function appendPastMeetingsCache(
  tzOffsetMinutes: number,
  items: MeetingsCacheEntry['items'],
  nextCursor: string | null,
  hasMore: boolean,
): Promise<void> {
  const key = cacheKey('past', tzOffsetMinutes);
  const existing = memory.get(key);
  if (!existing) {
    await writeMeetingsCache({
      bucket: 'past',
      tzOffsetMinutes,
      items,
      nextCursor,
      hasMore,
      updatedAt: Date.now(),
    });
    return;
  }

  const seen = new Set(existing.items.map((item) => item.id));
  const merged = [
    ...existing.items,
    ...items.filter((item) => !seen.has(item.id)),
  ];

  memory.set(key, {
    ...existing,
    items: merged,
    nextCursor,
    hasMore,
    updatedAt: Date.now(),
  });
}

export async function invalidateMeetingsCache(): Promise<void> {
  memory.clear();
}

export async function removeMeetingFromCache(meetingId: string): Promise<void> {
  for (const [key, entry] of memory.entries()) {
    memory.set(key, {
      ...entry,
      items: entry.items.filter((item) => item.id !== meetingId),
    });
  }
}
