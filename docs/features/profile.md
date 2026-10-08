# پروفایل کاربر

## خلاصه

صفحه پروفایل برای مشاهده و ویرایش اطلاعات شخصی کاربر. شامل تصویر پروفایل، نام، ایمیل و حذف نرم حساب.

## Endpointها

| Method | Path | Auth | توضیح |
|--------|------|------|-------|
| GET | `/api/v1/auth/me` | Bearer | دریافت پروفایل |
| PATCH | `/api/v1/auth/profile` | Bearer | ویرایش نام و ایمیل |
| POST | `/api/v1/auth/profile/avatar` | Bearer | آپلود تصویر (multipart) |
| DELETE | `/api/v1/auth/account` | Bearer | حذف نرم حساب |

## فیلدها

| فیلد | قابل ویرایش | توضیح |
|------|-------------|-------|
| `firstName` | بله | نام |
| `lastName` | بله | نام خانوادگی |
| `phone` | خیر | فقط نمایش |
| `email` | بله | اختیاری |
| `avatarUrl` | بله (آپلود) | مسیر فایل ذخیره‌شده |

## حذف حساب

- با `DELETE /auth/account` انجام می‌شود
- در دیتابیس `deleted_at` ست می‌شود (soft delete)
- کاربر حذف‌شده نمی‌تواند دوباره وارد شود
- تصویر پروفایل از دیسک حذف می‌شود

## Feature flag

`profile.manage` در `packages/shared`، tier: personal

## UI موبایل

- مسیر: `/profile`
- از منوی پروفایل در داشبورد قابل دسترسی است
- کامپوننت: `apps/mobile/components/profile/ProfileScreen.tsx`

## تست‌ها

- `packages/shared/src/auth/is-profile-complete.spec.ts`
- `apps/api/src/auth/auth.service.spec.ts`
