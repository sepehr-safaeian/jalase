import type { MeetingBucket, MeetingListResponse } from '@jalase/shared';
import type { MeetingsCacheEntry } from './meetings-cache';

const DB_NAME = 'jalase-meetings-v1';
const STORE = 'buckets';
const DB_VERSION = 1;

function cacheKey(bucket: MeetingBucket, tzOffsetMinutes: number): string {
  return `${bucket}:${tzOffsetMinutes}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    Promise.resolve(fn(store))
      .then(resolve)
      .catch(reject);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}

type StoredRow = MeetingsCacheEntry & { key: string };

export async function readMeetingsCache(
  bucket: MeetingBucket,
  tzOffsetMinutes: number,
): Promise<MeetingsCacheEntry | null> {
  if (typeof indexedDB === 'undefined') return null;

  const key = cacheKey(bucket, tzOffsetMinutes);
  return withStore('readonly', (store) => {
    return new Promise<MeetingsCacheEntry | null>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const row = request.result as StoredRow | undefined;
        if (!row) {
          resolve(null);
          return;
        }
        const { key: _key, ...entry } = row;
        resolve(entry);
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export async function writeMeetingsCache(entry: MeetingsCacheEntry): Promise<void> {
  if (typeof indexedDB === 'undefined') return;

  const key = cacheKey(entry.bucket, entry.tzOffsetMinutes);
  await withStore('readwrite', (store) => {
    store.put({ ...entry, key });
    return undefined as unknown as IDBRequest;
  });
}

export async function appendPastMeetingsCache(
  tzOffsetMinutes: number,
  items: MeetingListResponse['items'],
  nextCursor: string | null,
  hasMore: boolean,
): Promise<void> {
  const existing = await readMeetingsCache('past', tzOffsetMinutes);
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
  await writeMeetingsCache({
    ...existing,
    items: [
      ...existing.items,
      ...items.filter((item) => !seen.has(item.id)),
    ],
    nextCursor,
    hasMore,
    updatedAt: Date.now(),
  });
}

export async function invalidateMeetingsCache(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  await withStore('readwrite', (store) => {
    store.clear();
    return undefined as unknown as IDBRequest;
  });
}

export async function removeMeetingFromCache(meetingId: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const request = store.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const row = cursor.value as StoredRow;
      const nextItems = row.items.filter((item) => item.id !== meetingId);
      if (nextItems.length !== row.items.length) {
        cursor.update({ ...row, items: nextItems });
      }
      cursor.continue();
    };

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
