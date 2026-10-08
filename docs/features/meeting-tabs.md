# تب‌های زمانی جلسات (Meeting Tabs)

## خلاصه

صفحه خانه به‌جای دو سکشن «آینده / اخیر»، **۴ تب** شبیه تلگرام دارد:

| تب | بازه `meeting_date` (محلی کاربر) |
|----|----------------------------------|
| امروز | `[الان, شروع فردا)` — فقط جلسات باقی‌مانده امروز |
| فردا | `[شروع فردا, پس‌فردا)` |
| هفته آینده | `[پس‌فردا, +۷ روز)` |
| گذشته | `< الان` — شامل جلسات امروز که ساعتشان گذشته + صفحه‌بندی |

## API

### `GET /api/v1/notes/meetings`

Query:

- `bucket`: `today` | `tomorrow` | `next_week` | `past`
- `tzOffsetMinutes`: آفست محلی (پیش‌فرض ۲۱۰ = ایران)
- `cursor`, `limit`: فقط برای `past`

Response: `{ items, nextCursor, hasMore, bucket }`

## کش کلاینت

- **وب:** IndexedDB (`jalase-meetings-v1`)، stale-while-revalidate
- **native:** حافظه in-process (fallback)
- تب **گذشته:** صفحات بعدی در IDB append می‌شوند

## UI

- `MeetingTabs`: underline متحرک، badge تعداد
- `useMeetingBucket`: fetch + cache + pull-to-refresh
- empty state مخصوص هر تب

## Feature flag

`notes.meetingTabs` در `packages/shared`

## تست

- `meeting-buckets.spec.ts` (shared)
- `notes.service` listMeetings (API)
