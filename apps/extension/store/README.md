# Chrome Web Store and Firefox AMO Assets

## Package

```bash
npm run zip --workspace=@jalase/extension        # Chrome
npm run zip:firefox --workspace=@jalase/extension # Firefox
```

Outputs in `apps/extension/.output/`.

## Listing

- **Name:** Jalase
- **Short description:** Record and transcribe Google Meet meetings
- **Site:** https://jalase.me
- **Category:** Productivity

## Permissions justification

| Permission | Reason |
|------------|--------|
| `tabCapture` | Record meeting audio from Google Meet tab |
| `offscreen` | MediaRecorder for tab audio stream |
| `storage` | JWT session (same key as Jalase app) |
| `notifications` | Notify when transcript is ready |
| `meet.google.com` | Inject consent UI and recorder overlay |

## Screenshots checklist

1. Consent modal on Google Meet
2. Recorder overlay during call
3. Popup OTP login
4. Success notification / toast
5. Note open in Jalase mobile app

## Icons

Place PNG icons at `public/icon/16.png`, `32.png`, `48.png`, `128.png`.
Source SVG: `public/icon/icon.svg` (green #187A45 on canvas #F7F7F2).

## Review notes

- Extension only activates on `meet.google.com`
- User must explicitly consent before recording
- Recording indicator always visible during capture
- Audio uploaded to the user's Jalase account via the existing API
