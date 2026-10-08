# Contributing to Jalase

Thanks for helping improve Jalase. This guide keeps the monorepo consistent and reviewable.

## Ground rules

- Prefer small, focused pull requests
- Match existing TypeScript style and folder conventions
- Do not commit secrets, API keys, or real `.env` files
- Add or update tests when you change behavior
- Document new product features under `docs/features/`

## Local setup

```bash
git clone https://github.com/sepehr-safaeian/jalase.git
cd jalase
cp .env.example .env
npm install
npm run docker:up
npm run build --workspace=@jalase/shared
npm run dev:api
# in another terminal
npm run dev:web
```

## Project map

| Path | Role |
|------|------|
| `apps/api` | NestJS REST API (`/api/v1`) |
| `apps/mobile` | Expo React Native + web/PWA |
| `apps/extension` | Browser extension (WXT) |
| `packages/shared` | Shared types, feature flags, note utilities |

## Development checklist

1. Create a branch from `main`
2. Run targeted tests for the workspace you touched
3. Keep UI copy in i18n catalogs (`en` / `fa`)
4. Keep English as the default locale and LTR layout
5. Use Gregorian dates (no Jalali calendar)
6. Open a PR with a clear summary and test plan

## Commit messages

Use concise, present-tense messages that explain **why**:

```text
feat(api): add email OTP sign-in for international users
fix(mobile): force LTR when locale is English
docs: expand self-hosting guide in README
```

## Code of collaboration

Be respectful in issues and reviews. Assume positive intent. Push back on design with reasons, not ego.
