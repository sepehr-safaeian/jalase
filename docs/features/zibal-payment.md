# درگاه پرداخت زیبال

## خلاصه

پرداخت اشتراک و توربو از طریق **درگاه IPG زیبال** انجام می‌شود. فعلاً مرچنت تست `zibal` فعال است.

## جریان پرداخت

```
۱. POST /subscriptions/orders (یا addon-orders) → pending_payment
۲. POST /subscriptions/orders/:id/pay/init → paymentUrl + trackId
۳. کاربر به paymentUrl می‌رود (HTTP 302 مستقیم API → زیبال، بدون inline script)
۴. پرداخت در زیبال
۵. GET /payments/zibal/callback?trackId=...&success=... → verify + فعال‌سازی
۶. Redirect به returnUrl (مثلا /subscription/result?status=success)
```

## Endpointها

| Method | Path | Auth | توضیح |
|--------|------|------|-------|
| POST | `/subscriptions/orders/:id/pay/init` | Bearer | شروع پرداخت زیبال |
| GET | `/payments/zibal/callback` | خیر | Callback زیبال |
| GET | `/payments/zibal/start/:trackId` | خیر | Redirect میانی با Referer |
| POST | `/subscriptions/orders/:id/pay` | Bearer | فقط dev + `ZIBAL_ALLOW_DEV_SIMULATE=true` |

## متغیرهای محیطی

| Variable | پیش‌فرض | توضیح |
|----------|---------|-------|
| `ZIBAL_MERCHANT` | `zibal` | مرچنت زیبال |
| `API_PUBLIC_URL` | `http://localhost:3000` | آدرس عمومی API برای callback |
| `PAYMENT_RETURN_URL` | `http://localhost:8081/subscription/result` | بازگشت پیش‌فرض |
| `PAYMENT_RETURN_ALLOWED_HOSTS` | `localhost,127.0.0.1,...` | دامنه‌های مجاز returnUrl |
| `ZIBAL_ALLOW_DEV_SIMULATE` | `false` | شبیه‌سازی پرداخت در dev |

## امنیت

- Verify سمت سرور پس از callback (الزام زیبال)
- تطبیق `amount` (ریال) و `orderId` با سفارش
- `returnUrl` فقط از دامنه‌های مجاز یا `jalase://`
- پرداخت مستقیم بدون درگاه در production غیرفعال
- `trackId` در start redirect فقط برای سفارش `pending_payment` معتبر است

## مبلغ

سفارش‌ها به **تومان** ذخیره می‌شوند. زیبال **ریال** می‌خواهد: `amountRial = amountToman × 10`.

## موبایل

- بازگشت: deep link `jalase://subscription/result`
- صفحه میانی API برای ارسال Referer (الزام زیبال در اپ)

## تست

1. `ZIBAL_MERCHANT=zibal` در `.env`
2. `API_PUBLIC_URL` باید از بیرون قابل دسترسی باشد (برای callback واقعی از ngrok استفاده کنید)
3. در محیط local، callback زیبال ممکن است به localhost redirect کند اگر `API_PUBLIC_URL` لوکال باشد

## UI

- مودال تأیید قبل از انتقال به درگاه
- صفحه `/subscription/result` برای موفق / ناموفق / لغو
