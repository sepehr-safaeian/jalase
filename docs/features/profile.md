# User Profile

## Summary

The profile screen lets users view and edit personal information. It includes profile photo, name, email, and soft account deletion.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/auth/me` | Bearer | Get profile |
| PATCH | `/api/v1/auth/profile` | Bearer | Update name and email |
| POST | `/api/v1/auth/profile/avatar` | Bearer | Upload image (multipart) |
| DELETE | `/api/v1/auth/account` | Bearer | Soft-delete account |

## Fields

| Field | Editable | Description |
|-------|----------|-------------|
| `firstName` | Yes | First name |
| `lastName` | Yes | Last name |
| `phone` | No | Display only |
| `email` | Yes | Optional |
| `avatarUrl` | Yes (upload) | Stored file path |

## Account deletion

- Performed via `DELETE /auth/account`
- Sets `deleted_at` in the database (soft delete)
- Deleted users cannot sign in again
- Profile image is removed from disk

## Feature flag

`profile.manage` in `packages/shared`, tier: personal

## Mobile UI

- Route: `/profile`
- Accessible from the profile menu on the dashboard
- Component: `apps/mobile/components/profile/ProfileScreen.tsx`

## Tests

- `packages/shared/src/auth/is-profile-complete.spec.ts`
- `apps/api/src/auth/auth.service.spec.ts`
