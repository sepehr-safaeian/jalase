# Health Check

## خلاصه

endpoint سلامت سرویس برای monitoring و readiness probe.

## Endpoint

`GET /api/v1/health`

## پاسخ

```json
{
  "status": "ok",
  "timestamp": "ISO-8601",
  "environment": "development",
  "version": "0.1.0"
}
```

## Tier

همه tierها، بدون احراز هویت

## تست‌ها

- `apps/api/src/health/health.service.spec.ts` (unit)
- `apps/api/test/app.e2e-spec.ts` (e2e)
