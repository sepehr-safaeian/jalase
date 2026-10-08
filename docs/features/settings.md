# تنظیمات

## خلاصه

صفحه تنظیمات برای مدیریت ظاهر اپ (محلی) و ترجیحات حریم خصوصی (همگام با سرور).

## بخش‌ها

### ظاهر (محلی)

| تنظیم | گزینه‌ها | ذخیره‌سازی |
|-------|---------|-----------|
| تم | روشن / تیره | دستگاه (SecureStore / localStorage) |
| سایز فونت | بزرگ / متوسط / کوچک | دستگاه |

کلید ذخیره: `jalase_app_preferences`

### امنیت و حریم خصوصی (سرور)

| تنظیم | پیش‌فرض | Endpoint |
|-------|---------|----------|
| رضایت اشتراک داده AI | `true` | `PATCH /api/v1/auth/settings` |

## Endpoint

`PATCH /api/v1/auth/settings`

```json
{
  "aiDataSharingConsent": false
}
```

فیلد `aiDataSharingConsent` در `GET /auth/me` هم برگردانده می‌شود.

## Feature flag

`settings.manage` در `packages/shared`

## UI موبایل

- مسیر: `/settings`
- از منوی پروفایل در داشبورد
- کامپوننت: `apps/mobile/components/settings/SettingsScreen.tsx`

## تست‌ها

- `apps/api/src/auth/auth.service.spec.ts`
- `apps/mobile/lib/settings/settings-storage.spec.ts`
