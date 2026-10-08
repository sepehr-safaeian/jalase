# Observability

## Summary

Structured request logging, pipeline stage latency, and an optional in-memory metrics endpoint for the NestJS API.

## Components

| Piece | Location |
|-------|----------|
| Pino logger | `nestjs-pino` via `AppModule` / `main.ts` |
| Request id | `RequestIdMiddleware` (`x-request-id`) |
| HTTP latency | `LatencyInterceptor` |
| Stage timers | `PipelineTimer` + `MetricsService` |
| Metrics HTTP | `GET /api/v1/health/metrics` |

## Env

| Key | Default | Notes |
|-----|---------|-------|
| `LOG_LEVEL` | `info` | Pino level |
| `LOG_PRETTY` | `true` in development | Pretty print locally |
| `METRICS_ENABLED` | unset | When `true`, metrics route is always on; also on in `development` |

## Pipeline log fields

`stage`: `asr` | `review` | `extract`  
`outcome`: `ok` | `empty` | `error` | `guardrail_reject`

## Feature flag

N/A (always-on infrastructure).

## Security

- Redact email / phone via guardrails before logging user-like text
- Metrics endpoint exposes aggregates only (no transcript bodies)
