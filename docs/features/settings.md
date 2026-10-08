# Settings

## Summary

The settings screen manages app appearance (local) and privacy preferences (synced with the server).

## Sections

### Appearance (local)

| Setting | Options | Storage |
|---------|---------|---------|
| Theme | Light / Dark | Device (SecureStore / localStorage) |
| Font size | Large / Medium / Small | Device |

Storage key: `jalase_app_preferences`

### Security and privacy (server)

| Setting | Default | Endpoint |
|---------|---------|----------|
| AI data sharing consent | `true` | `PATCH /api/v1/auth/settings` |

## Endpoint

`PATCH /api/v1/auth/settings`

```json
{
  "aiDataSharingConsent": false
}
```

The `aiDataSharingConsent` field is also returned in `GET /api/v1/auth/me`.

## Feature flag

`settings.manage` in `packages/shared`

## Mobile UI

- Route: `/settings`
- From the profile menu on the dashboard
- Component: `apps/mobile/components/settings/SettingsScreen.tsx`

## Tests

- `apps/api/src/auth/auth.service.spec.ts`
- `apps/mobile/lib/settings/settings-storage.spec.ts`
