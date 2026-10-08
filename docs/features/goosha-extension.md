# Jalase browser extension

Chrome/Firefox browser extension for recording online meeting audio and transcribing via the Jalase API.

## Phase 1: Google Meet

| Item | Value |
|------|-------|
| Workspace | `apps/extension` |
| Package | `@jalase/extension` |
| Host | `https://meet.google.com/*` |
| Feature flags | `meeting.connect`, `meeting.record` |

## User flow

1. User joins Google Meet.
2. Extension shows **ConsentModal**: "Record this meeting?"
3. On "Yes": auth + tier check → create note → tab capture → **RecorderOverlay**
4. "Stop recording" → upload → server transcription → notification + toast
5. "View in Jalase app" → `https://goosha.app/notes/:id`

## Architecture

```
Content Script (Meet) → Service Worker → Offscreen (MediaRecorder)
                              ↓
                         API /api/v1
```

- All fetches from the Service Worker (no CORS)
- JWT in `chrome.storage.local` under key `jalase_access_token`
- Audio: `chrome.tabCapture.getMediaStreamId` + Offscreen `getUserMedia`

## API (reuse)

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/otp/send` | OTP |
| `POST /auth/otp/verify` | Sign in |
| `GET /auth/me` | session |
| `GET /feature-flags/me` | tier gating |
| `POST /notes` | Create note |
| `POST /notes/:id/recording/start` | Start session |
| `POST /notes/:id/recording/finalize` | Upload + transcribe |
| `POST /notes/:id/recording/stop` | Cancel |

## Platform adapters

| Platform | Adapter | Phase |
|----------|---------|-------|
| Google Meet | `platforms/google-meet.ts` | 1 |
| MS Teams | `platforms/stubs.ts` | 2 |
| Skype | `platforms/stubs.ts` | 3 |
| Jitsi | `platforms/stubs.ts` | 3 |
| BigBlueButton | `platforms/stubs.ts` | 3 |

## Permissions

- `storage`, `activeTab`, `tabCapture`, `offscreen`, `notifications`
- `host_permissions`: `meet.google.com` (phase 1)

## Development

```bash
npm run dev:extension
```

Load: `apps/extension/.output/chrome-mv3`

Env: `WXT_API_URL`, `WXT_GOOSHA_APP_URL`

## Manual QA (Google Meet)

- [ ] Install unpacked extension
- [ ] OTP sign-in from popup
- [ ] Join Meet → Consent → Recorder
- [ ] Pause / resume / stop
- [ ] Transcript in Jalase app
- [ ] Tier without `meeting.record` → upgrade message
- [ ] Cancel recording
- [ ] "No, thanks" → do not show again in same session

## Store

Publishing guide: `apps/extension/store/README.md`

## UI

- Design tokens: `src/styles/tokens.css`
- Visual reference: `MeetingRecorderScreen.web.tsx` (mobile/PWA)
- Font: local Vazirmatn in `public/fonts/`

## Links

- [Meeting recorder (PWA)](./goosha-recorder.md)
- [OTP authentication](./auth-phone-otp.md)
- [Meeting transcription](./meeting-transcription.md)
