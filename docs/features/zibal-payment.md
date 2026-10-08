# Zibal Payment Gateway

> **Open-source build:** Zibal IPG checkout and subscription payment activation are **disabled** in the OSS build. This document describes the production integration for reference.

## Summary

Subscription and Turbo payments run through the **Zibal IPG gateway**. In development, the test merchant `zibal` is typically used.

## Payment flow

```
1. POST /api/v1/subscriptions/orders (or addon-orders) → pending_payment
2. POST /api/v1/subscriptions/orders/:id/pay/init → paymentUrl + trackId
3. User opens paymentUrl (HTTP 302 direct from API → Zibal, no inline script)
4. Payment on Zibal
5. GET /api/v1/payments/zibal/callback?trackId=...&success=... → verify + activation
6. Redirect to returnUrl (e.g. /subscription/result?status=success)
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/subscriptions/orders/:id/pay/init` | Bearer | Start Zibal payment |
| GET | `/api/v1/payments/zibal/callback` | No | Zibal callback |
| GET | `/api/v1/payments/zibal/start/:trackId` | No | Intermediate redirect with Referer |
| POST | `/api/v1/subscriptions/orders/:id/pay` | Bearer | Dev only + `ZIBAL_ALLOW_DEV_SIMULATE=true` |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ZIBAL_MERCHANT` | `zibal` | Zibal merchant ID |
| `API_PUBLIC_URL` | `http://localhost:3000` | Public API URL for callback |
| `PAYMENT_RETURN_URL` | `http://localhost:8081/subscription/result` | Default return URL |
| `PAYMENT_RETURN_ALLOWED_HOSTS` | `localhost,127.0.0.1,...` | Allowed returnUrl hosts |
| `ZIBAL_ALLOW_DEV_SIMULATE` | `false` | Simulate payment in dev |

## Security

- Server-side verify after callback (Zibal requirement)
- Match `amount` (Rial) and `orderId` to the order
- `returnUrl` only from allowed hosts or `jalase://`
- Direct payment without gateway disabled in production
- `trackId` in start redirect valid only for `pending_payment` orders

## Amount

Orders are stored in **Toman**. Zibal expects **Rial**: `amountRial = amountToman × 10`.

## Mobile

- Return: deep link `jalase://subscription/result`
- Intermediate API page to send Referer (Zibal requirement in the app)

## Testing

1. Set `ZIBAL_MERCHANT=zibal` in `.env`
2. `API_PUBLIC_URL` must be reachable from the internet (use ngrok for a real callback)
3. Locally, Zibal callback may redirect to localhost if `API_PUBLIC_URL` is local

## UI

- Confirmation modal before redirect to the gateway
- Page `/subscription/result` for success / failure / cancel
