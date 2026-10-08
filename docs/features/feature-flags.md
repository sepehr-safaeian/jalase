# Feature Flags



## خلاصه



سیستم feature flag برای کنترل دسترسی ویژگی‌ها بر اساس tier (free / plus / pro / enterprise).



## Endpoint



- `GET /api/v1/feature-flags` - tier از env

- `GET /api/v1/feature-flags/me` - tier از اشتراک کاربر



## منبع حقیقت



`packages/shared/src/feature-flags/flags.ts`



## Tierها



| Tier | دسترسی |

|------|--------|

| **free** | یادداشت دستی، جستجو، تنظیمات |

| **plus** | AI، اتصال Meet/Zoom، اشتراک‌گذاری، پروژه |

| **pro** | همه plus + اتصالات extended (Skype, Jitsi, BBB) |

| **enterprise** | SSO، استقرار لوکال (آینده) |



## تست‌ها



- `packages/shared/src/feature-flags/is-feature-enabled.spec.ts` (unit)

- `apps/api/test/app.e2e-spec.ts` (e2e)



## افزودن فیچر جدید



1. flag را در `packages/shared` ثبت کن

2. در API/کلاینت با `isFeatureEnabled` بررسی کن

3. داک و تست بنویس

