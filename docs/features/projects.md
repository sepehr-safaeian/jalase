# مدیریت پروژه‌ها

## خلاصه

کاربر از منوی پروفایل (آواتار بالای خانه) به **پروژه‌ها** می‌رود، پروژه می‌سازد، swipe برای حذف/ویرایش دارد، و با tap روی هر پروژه لیست جلسات همان پروژه را می‌بیند.

## جریان کاربر

```
خانه → آواتار → پروژه‌ها → لیست پروژه‌ها
                              ├ swipe چپ: حذف
                              ├ swipe راست: ویرایش
                              └ tap: جزئیات + جلسات پروژه
```

## مدل داده

جدول `projects` (موجود):

| فیلد | توضیح |
|------|--------|
| `name` | نام پروژه (۲–۱۲۰ کاراکتر) |
| `color` | hex اختیاری |
| `archived_at` | آرشیو نرم |

یادداشت‌ها با `notes.project_id` به پروژه وصل می‌شوند (`ON DELETE SET NULL`).

## API

| Method | Route | توضیح |
|--------|-------|--------|
| GET | `/api/v1/projects` | لیست پروژه‌ها |
| POST | `/api/v1/projects` | ایجاد |
| GET | `/api/v1/projects/:id` | جزئیات + `noteCount` |
| PATCH | `/api/v1/projects/:id` | ویرایش نام/رنگ |
| DELETE | `/api/v1/projects/:id` | حذف |
| GET | `/api/v1/projects/:id/meetings` | جلسات پروژه (cursor pagination) |

## کلاینت

- `ProfileMenu`: گزینه «پروژه‌ها»
- `ProjectsScreen`: لیست + FAB + swipe
- `ProjectDetailScreen`: جلسات پروژه
- `ProjectEditSheet`: ایجاد/ویرایش با palette رنگ برند
- `NoteProjectSheet`: انتساب پروژه به جلسه (ادیتور)

## Feature flag

`notes.projects` در `packages/shared` (tier: personal)

## تست

- `notes.service.spec.ts`: `listProjectMeetings`
