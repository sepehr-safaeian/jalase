# Goosha Extension

Browser extension for recording and transcribing online meetings (Phase 1: Google Meet).

## Development

```bash
# From repo root
npm install
npm run dev:extension
```

Load unpacked extension from `apps/extension/.output/chrome-mv3` in Chrome.

Copy Vazirmatn woff2 fonts into `public/fonts/` from `apps/mobile/assets/fonts/` (convert TTF to woff2 if needed).

## Environment

Copy `.env.example` to `.env`:

```
WXT_API_URL=http://localhost:3000/api/v1
WXT_GOOSHA_APP_URL=https://goosha.app
```

## Build

```bash
npm run build --workspace=@jalase/extension
npm run build:firefox --workspace=@jalase/extension
npm run zip --workspace=@jalase/extension
```

## Store submission

See [store/README.md](./store/README.md).

## Architecture

See [docs/features/goosha-extension.md](../../docs/features/goosha-extension.md).
