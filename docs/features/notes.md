# یادداشت‌ها (Notes)

## خلاصه محصول

یادداشت = جلسه. هر یادداشت یک فضای Tiptap (Notion-like) دارد با متادیتای قابل لمس:

| متادیتا | رفتار |
|---------|--------|
| **تاریخ** | نمایش تاریخ ایجاد، آخرین ویرایش، تاریخ جلسه |
| **اعضا** | لیست + افزودن سریع (نام + ایمیل) |
| **پروژه** | انتخاب از پروژه‌های کاربر یا ایجاد پروژه جدید |

## مدل داده

- **Project**: نام، رنگ، آرشیو، مالک
- **Note**: عنوان، `contentJson` (Tiptap document)، پروژه، تاریخ جلسه، اعضا، `archivedAt`، `deletedAt`
- **NoteMember**: نام، ایمیل (unique per note)

### آرشیو و حذف

| عمل | رفتار |
|-----|--------|
| **آرشیو** | `archivedAt` ست می‌شود، از لیست اصلی پنهان، قابل بازگردانی |
| **حذف** | `deletedAt` ست می‌شود (soft delete)، از همه لیست‌ها پنهان |

## API

| متد | مسیر |
|-----|------|
| GET/POST | `/api/v1/notes` |
| GET/PATCH/DELETE | `/api/v1/notes/:id` |
| POST | `/api/v1/notes/:id/archive` |
| POST | `/api/v1/notes/:id/unarchive` |
| POST/DELETE | `/api/v1/notes/:id/members` |
| GET/POST | `/api/v1/projects` |
| PATCH/DELETE | `/api/v1/projects/:id` |
| POST | `/api/v1/projects/:id/archive` |

Query `GET /notes`: `includeArchived=true` برای نمایش آرشیو (فاز بعد: UI آرشیو)

## موبایل

- `/notes/new` → ایجاد و redirect به editor
- `/notes/[id]` → ادیتور Tiptap v3 (Notion-like)، پس‌زمینه canvas
- Home → لیست یادداشت‌ها از API
- **Swipe** روی کارت جلسه (به چپ): حذف با پس‌زمینه قرمز کم‌رنگ و متن قرمز پررنگ؛ کشیدن کامل = حذف خودکار

## Feature flag

- `personal`: CRUD یادداشت و پروژه شخصی
- `team`: اشتراک اعضا (فاز بعد)
- `enterprise`: (فاز بعد)

## تست

- `notes.service.spec.ts` (unit)
- ادیتور: ذخیره خودکار debounce 700ms
