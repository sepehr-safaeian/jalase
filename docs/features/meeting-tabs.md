# Meeting Tabs

## Summary

The home screen uses **4 tabs** (Telegram-style) instead of two sections for "Upcoming / Recent":

| Tab | `meeting_date` range (user local time) |
|-----|----------------------------------------|
| Today | `[now, start of tomorrow)` - only meetings still remaining today |
| Tomorrow | `[start of tomorrow, day after tomorrow)` |
| Next week | `[day after tomorrow, +7 days)` |
| Past | `< now` - includes today's meetings whose time has passed, plus pagination |

## API

### `GET /api/v1/notes/meetings`

Query:

- `bucket`: `today` | `tomorrow` | `next_week` | `past`
- `tzOffsetMinutes`: local offset (default 210 = Iran)
- `cursor`, `limit`: only for `past`

Response: `{ items, nextCursor, hasMore, bucket }`

## Client cache

- **Web:** IndexedDB (`jalase-meetings-v1`), stale-while-revalidate
- **Native:** in-process memory (fallback)
- **Past tab:** subsequent pages are appended in IDB

## UI

- `MeetingTabs`: animated underline, count badge
- `useMeetingBucket`: fetch + cache + pull-to-refresh
- Empty state per tab

## Feature flag

`notes.meetingTabs` in `packages/shared`

## Tests

- `meeting-buckets.spec.ts` (shared)
- `notes.service` listMeetings (API)
