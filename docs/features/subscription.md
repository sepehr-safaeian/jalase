# اشتراک و پلن‌ها

## پلن‌ها

| پلن | قیمت ماهانه | خلاصه |
|-----|-------------|-------|
| **رایگان** | ۰ | یادداشت دستی، جلسات حضوری، بدون AI |
| **پلاس** | ۱۴۹٬۰۰۰ تومان | AI تا ۱۰ بار/ماه، Meet و Zoom، اشتراک‌گذاری |
| **پرو** | ۴۹۹٬۰۰۰ تومان | AI تا ۳۰ بار/ماه، همه اتصالات جلسه، اشتراک‌گذاری |

## پکیج توربو

| افزونه | قیمت ماهانه | شرط |
|--------|-------------|-----|
| **توربو** | ۲۹۹٬۰۰۰ تومان | اشتراک فعال پلاس یا پرو + AI نامحدود |

نسخه **سازمانی (enterprise)** پس از MVP در نظر گرفته شده است.

## دوره‌های پرداخت

اشتراک ماهانه است، اما پرداخت به‌صورت دوره‌ای:

| دوره | پرداخت | اعتبار |
|------|--------|--------|
| ۳ ماهه | ۳ ماه | ۳ ماه |
| ۶ ماهه | ۶ ماه | ۶ ماه |
| یک‌ساله | ۱۲ ماه | ۱۴ ماه (+۲ ماه هدیه) |

## جریان سفارش

1. `POST /subscriptions/orders` - ایجاد سفارش پلن با وضعیت `pending_payment`
2. `POST /subscriptions/addon-orders` - ایجاد سفارش توربو (نیاز به پلاس/پرو فعال)
3. `POST /subscriptions/orders/:id/pay/init` - شروع پرداخت زیبال
4. Callback و verify در `GET /payments/zibal/callback`
5. اشتراک فعال می‌شود و `expires_at` ست می‌شود

جزئیات درگاه: `docs/features/zibal-payment.md`

## Endpointها

| Method | Path | Auth |
|--------|------|------|
| GET | `/subscriptions/plans` | خیر |
| GET | `/subscriptions/me` | Bearer |
| POST | `/subscriptions/orders` | Bearer |
| POST | `/subscriptions/addon-orders` | Bearer |
| POST | `/subscriptions/orders/:id/pay/init` | Bearer |
| GET | `/payments/zibal/callback` | خیر |
| POST | `/subscriptions/orders/:id/pay` | Bearer (فقط dev) |
| POST | `/subscriptions/free` | Bearer |
| POST | `/workspaces` | Bearer (پلن پرو) |
| GET | `/workspaces/me` | Bearer |

## دیتابیس

- `subscriptions` - اشتراک فعال کاربر (`has_turbo`, `turbo_expires_at`)
- `subscription_orders` - سفارش‌ها (`order_type`: plan | addon)
- `workspaces` - ورک‌اسپیس (پلن پرو)
- `workspace_members` - اعضا و نقش

## Feature flag

| Flag | minTier |
|------|---------|
| `notes.create`, `notes.search` | free |
| `meeting.*`, `notes.share`, `notes.projects` | plus |
| `meeting.connect.extended` | pro |
| `enterprise.*` | enterprise |

## UI موبایل

مسیر: `/subscription`
