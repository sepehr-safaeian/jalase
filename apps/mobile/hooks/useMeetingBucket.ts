import { useCallback, useEffect, useRef, useState } from 'react';
import type { NoteSummary } from '@jalase/shared';
import { isMeetingBucketPaginated } from '@jalase/shared';
import {
  getClientTzOffsetMinutes,
  listMeetingsByBucket,
  type MeetingBucket,
} from '@/lib/api/meetings.api';
import {
  appendPastMeetingsCache,
  readMeetingsCache,
  writeMeetingsCache,
} from '@/lib/cache/meetings-cache';

interface UseMeetingBucketResult {
  meetings: NoteSummary[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  removeMeeting: (id: string) => void;
}

export function useMeetingBucket(
  bucket: MeetingBucket,
  enabled: boolean,
): UseMeetingBucketResult {
  const tzOffsetMinutes = getClientTzOffsetMinutes();
  const [meetings, setMeetings] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const applyResponse = useCallback(
    (items: NoteSummary[], nextCursor: string | null, hasMoreItems: boolean) => {
      setMeetings(items);
      cursorRef.current = nextCursor;
      setHasMore(hasMoreItems);
    },
    [],
  );

  const fetchFresh = useCallback(
    async (mode: 'initial' | 'refresh' | 'more') => {
      if (!enabled) return;

      if (mode === 'more') {
        if (!isMeetingBucketPaginated(bucket) || !cursorRef.current) return;
        setLoadingMore(true);
      } else if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await listMeetingsByBucket({
          bucket,
          tzOffsetMinutes,
          cursor: mode === 'more' ? cursorRef.current : undefined,
        });

        if (!mountedRef.current) return;

        if (mode === 'more' && bucket === 'past') {
          setMeetings((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            return [
              ...prev,
              ...response.items.filter((item) => !seen.has(item.id)),
            ];
          });
          cursorRef.current = response.nextCursor;
          setHasMore(response.hasMore);
          await appendPastMeetingsCache(
            tzOffsetMinutes,
            response.items,
            response.nextCursor,
            response.hasMore,
          );
        } else {
          applyResponse(response.items, response.nextCursor, response.hasMore);
          await writeMeetingsCache({
            bucket,
            tzOffsetMinutes,
            items: response.items,
            nextCursor: response.nextCursor,
            hasMore: response.hasMore,
            updatedAt: Date.now(),
          });
        }
        setError(null);
      } catch {
        if (!mountedRef.current) return;
        if (mode !== 'more') {
          setError('بارگذاری جلسات ناموفق بود');
        }
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [applyResponse, bucket, enabled, tzOffsetMinutes],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    let cancelled = false;

    void (async () => {
      const cached = await readMeetingsCache(bucket, tzOffsetMinutes);
      if (cancelled || !mountedRef.current) return;

      if (cached) {
        applyResponse(cached.items, cached.nextCursor, cached.hasMore);
        setLoading(false);
      }

      await fetchFresh(cached ? 'refresh' : 'initial');
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [applyResponse, bucket, enabled, fetchFresh, tzOffsetMinutes]);

  const refresh = useCallback(async () => {
    cursorRef.current = null;
    await fetchFresh('refresh');
  }, [fetchFresh]);

  const loadMore = useCallback(async () => {
    await fetchFresh('more');
  }, [fetchFresh]);

  const removeMeeting = useCallback((id: string) => {
    setMeetings((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    meetings,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    removeMeeting,
  };
}
