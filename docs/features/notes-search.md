# جستجوی یادداشت‌ها (Notes Search)

## خلاصه

جستجوی کلیدواژه‌ای در تمام یادداشت‌های کاربر با استراتژی دو مرحله‌ای برای کنترل سرعت و بار سرور.

## رفتار محصول

1. کاربر کلمه می‌نویسد (حداقل ۲ حرف)
2. **مرحله ۱**: جستجو در جلسات **۳۰ روز اخیر** (`scope=recent`)
3. **نمایش بیشتر**: صفحه بعد همان بازه، یا گسترش به **جلسات قدیمی‌تر** (`scope=older`)
4. هر نتیجه snippet و فیلد match (عنوان / متن / رونوشت) دارد

## فیلدهای searchable

- `title`
- `content_json`
- `content_markdown`
- `transcript_text`

## API

### `GET /api/v1/notes/search`

| Query | نوع | توضیح |
|-------|-----|-------|
| `q` | string | کلیدواژه (حداقل ۲ حرف) |
| `scope` | `recent` \| `older` | پیش‌فرض: `recent` |
| `cursor` | string | pagination |
| `limit` | number | پیش‌فرض ۱۵، حداکثر ۵۰ |

### پاسخ

```json
{
  "items": [{ "id", "title", "snippet", "matchField", "meetingDate", "updatedAt", "memberCount" }],
  "hasMore": true,
  "nextCursor": "...",
  "scope": "recent",
  "query": "جیرا",
  "expandableToOlder": true
}
```

- `expandableToOlder=true`: پایان صفحه‌بندی recent، دکمه «جلسات قدیمی‌تر» فعال است

## موبایل

- مسیر: `/search`
- دکمه ذره‌بین در `HomeHeader`
- debounce 350ms
- FlatList + دکمه «نمایش بیشتر»

## Feature flag

- `notes.search` (tier: free)

## آینده

- PostgreSQL full-text search (`tsvector`) برای scale
- هایلایت کلیدواژه در snippet
- فیلتر پروژه / تاریخ
- Redis cache برای queryهای پرتکرار
- Rate limit per user (مثلاً ۳۰ req/min)

## تست

- `packages/shared/src/notes/search-utils.spec.ts`
- `apps/api/src/notes/notes.service.spec.ts` (search)
