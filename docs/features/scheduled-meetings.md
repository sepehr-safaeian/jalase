# زمان‌بندی جلسات (Scheduled Meetings)

## خلاصه

کاربر از داشبورد می‌تواند **جلسه جدید** بسازد:
- **همین الان**: یادداشت فوراً باز می‌شود (`meetingDate = now`)
- **تنظیم برای آینده**: انتخاب تاریخ شمسی + ساعت/دقیقه، سپس ایجاد یادداشت با `meetingDate` آینده

یادداشت‌های زمان‌بندی‌شده **از لحظه ایجاد قابل دسترسی** هستند و در سکشن **جلسات آینده** نمایش داده می‌شوند.

## مدل داده

از فیلد موجود `notes.meeting_date` استفاده می‌شود. entity جداگانه Meeting نداریم (یادداشت = جلسه).

| حالت | `meeting_date` | سکشن UI |
|------|----------------|---------|
| همین الان | زمان ایجاد | جلسات اخیر |
| آینده | زمان انتخاب‌شده (> now) | جلسات آینده |

## API

### `POST /api/v1/notes`

```json
{
  "title": "جلسه جدید",
  "contentJson": "",
  "meetingDate": "2026-09-01T14:30:00.000Z"
}
```

- بدون `meetingDate`: پیش‌فرض `now`
- با `meetingDate`: باید **در آینده** باشد، وگرنه `400`

### `PATCH /api/v1/notes/:id`

- تغییر `meetingDate` با همان اعتبارسنجی آینده بودن

### `GET /api/v1/notes`

- بدون تغییر؛ کلاینت با `splitNotesBySchedule` از `@jalase/shared` تقسیم می‌کند

## کلاینت (موبایل)

- FAB: «جلسه جدید»
- `NewMeetingActionSheet`: انتخاب نوع ایجاد
- `ScheduleMeetingSheet`: wheel picker شمسی (سال/ماه/روز + ساعت/دقیقه)
- `HomeScreen`: سکشن «جلسات آینده» فقط در صورت وجود

## آینده (آماده‌سازی)

- Push reminder قبل از `meetingDate` (بدون GMS)
- Cron برای انتقال خودکار از upcoming به recent پس از گذشت زمان
- فیلتر `?scope=upcoming` در API برای scale
- index DB روی `(user_id, meeting_date)` در migration production
- recurring meetings (entity جدا)

## Feature flag

فعلاً tier **personal**، بدون flag جدا. برای enterprise calendar sync در آینده flag اضافه می‌شود.

## تست

- `packages/shared/src/notes/scheduling.spec.ts`
- `apps/api/src/notes/notes.service.spec.ts` (validation + create scheduled)
