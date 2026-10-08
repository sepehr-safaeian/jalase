# احراز هویت با شماره موبایل و OTP

## خلاصه

ورود و ثبت‌نام فقط با شماره موبایل ایرانی و کد ۶ رقمی OTP. فعلاً پنل پیامک وصل نیست؛ در محیط توسعه کد ثابت `123456` در پاسخ API و لاگ سرور برمی‌گردد.

## جریان کاربر

```
آنبوردینگ → ورود شماره → OTP → خوش‌آمدگویی (انیمیشن) → تکمیل نام (فقط کاربر جدید) → داشبورد
```

- کاربر قبلی با `displayName` پر شده: بعد از OTP مستقیم از مرحله خوش‌آمدگویی به داشبورد می‌رود.
- کاربر جدید: بعد از خوش‌آمدگویی فرم «شما را چی صدا بزنم؟» نمایش داده می‌شود.

## API

| متد | مسیر | توضیح |
|-----|------|-------|
| POST | `/api/v1/auth/otp/send` | ارسال OTP |
| POST | `/api/v1/auth/otp/verify` | تأیید OTP و دریافت JWT |
| GET | `/api/v1/auth/me` | کاربر جاری (Bearer) |
| PATCH | `/api/v1/auth/profile` | تکمیل نام (Bearer) |

## Feature flag

- `personal`: فعال
- `team` / `enterprise`: در فاز بعد

## محیط توسعه

1. PostgreSQL: `docker compose up -d`
2. `.env` از `.env.example`
3. API: `npm run start:dev --workspace=@jalase/api`
4. موبایل: `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`

## امنیت

- OTP با SHA-256 هش می‌شود
- حداکثر ۵ تلاش برای هر چالش
- انقضای OTP: ۱۲۰ ثانیه
- JWT در `expo-secure-store` (وب: localStorage)

## تست

- Unit: `AuthService`, `isProfileComplete`, `phone.utils`
- E2E API: نیاز به PostgreSQL در حال اجرا
