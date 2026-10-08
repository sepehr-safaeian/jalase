# Health check

## Summary

Service health endpoint for monitoring and readiness probes.

## Endpoint

`GET /api/v1/health`

## Response

```json
{
  "status": "ok",
  "timestamp": "ISO-8601",
  "environment": "development",
  "version": "0.1.0"
}
```

## Tier

All tiers, no authentication required

## Tests

- `apps/api/src/health/health.service.spec.ts` (unit)
- `apps/api/test/app.e2e-spec.ts` (e2e)
