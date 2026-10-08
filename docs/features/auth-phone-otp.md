# Phone number and OTP authentication

## Summary

Sign-in and registration use only an Iranian mobile number and a 6-digit OTP code. SMS panel integration is not wired yet; in development the fixed code `123456` is returned in the API response and server logs.

## User flow

```
Onboarding → Enter phone → OTP → Welcome (animation) → Complete name (new users only) → Dashboard
```

- Returning user with `displayName` set: after OTP, goes from the welcome step straight to the dashboard.
- New user: after welcome, the form "What should we call you?" is shown.

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/otp/send` | Send OTP |
| POST | `/api/v1/auth/otp/verify` | Verify OTP and receive JWT |
| GET | `/api/v1/auth/me` | Current user (Bearer) |
| PATCH | `/api/v1/auth/profile` | Complete name (Bearer) |

## Feature flag

- `personal`: enabled
- `team` / `enterprise`: planned for a later phase

## Development environment

1. PostgreSQL: `docker compose up -d`
2. `.env` from `.env.example`
3. API: `npm run start:dev --workspace=@jalase/api`
4. Mobile: `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`

## Security

- OTP is hashed with SHA-256
- Maximum 5 attempts per challenge
- OTP expiry: 120 seconds
- JWT stored in `expo-secure-store` (web: localStorage)

## Tests

- Unit: `AuthService`, `isProfileComplete`, `phone.utils`
- API E2E: requires PostgreSQL running
