# Feature flags

## Summary

Feature flag system for controlling feature access by tier (free / plus / pro / enterprise).

## Endpoints

- `GET /api/v1/feature-flags` - tier from env
- `GET /api/v1/feature-flags/me` - tier from user subscription

## Source of truth

`packages/shared/src/feature-flags/flags.ts`

## Tiers

| Tier | Access |
|------|--------|
| **free** | Manual notes, search, settings |
| **plus** | AI, Meet/Zoom connection, sharing, projects |
| **pro** | All plus features + extended integrations (Skype, Jitsi, BBB) |
| **enterprise** | SSO, on-prem deployment (future) |

## Tests

- `packages/shared/src/feature-flags/is-feature-enabled.spec.ts` (unit)
- `apps/api/test/app.e2e-spec.ts` (e2e)

## Adding a new feature

1. Register the flag in `packages/shared`
2. Check with `isFeatureEnabled` in API/client
3. Write documentation and tests
