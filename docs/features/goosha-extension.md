# افزونه Goosha (گوشا)

افزونه مرورگر Chrome/Firefox برای ضبط صدای جلسات آنلاین و رونویسی با API جلسه.

## فاز ۱: Google Meet

| مورد | مقدار |
|------|-------|
| Workspace | `apps/extension` |
| Package | `@jalase/extension` |
| Host | `https://meet.google.com/*` |
| Feature flags | `meeting.connect`, `meeting.record` |

## جریان کاربر

1. کاربر وارد Google Meet می‌شود.
2. افزونه **ConsentModal** نشان می‌دهد: «این جلسه ضبط شود؟»
3. با «بله»: بررسی auth + tier → ایجاد یادداشت → tab capture → **RecorderOverlay**
4. «پایان ضبط» → آپلود → رونویسی سرور → notification + toast
5. «مشاهده در اپ Goosha» → `https://goosha.app/notes/:id`

## معماری

```
Content Script (Meet) → Service Worker → Offscreen (MediaRecorder)
                              ↓
                         API /api/v1
```

- تمام fetchها از Service Worker (بدون CORS)
- JWT در `chrome.storage.local` با کلید `jalase_access_token`
- صدا: `chrome.tabCapture.getMediaStreamId` + Offscreen `getUserMedia`

## API (reuse)

| Endpoint | کاربرد |
|----------|--------|
| `POST /auth/otp/send` | OTP |
| `POST /auth/otp/verify` | ورود |
| `GET /auth/me` | session |
| `GET /feature-flags/me` | tier gating |
| `POST /notes` | ایجاد یادداشت |
| `POST /notes/:id/recording/start` | شروع session |
| `POST /notes/:id/recording/finalize` | آپلود + رونویسی |
| `POST /notes/:id/recording/stop` | لغو |

## Platform adapters

| Platform | Adapter | فاز |
|----------|---------|-----|
| Google Meet | `platforms/google-meet.ts` | ۱ |
| MS Teams | `platforms/stubs.ts` | ۲ |
| Skype | `platforms/stubs.ts` | ۳ |
| Jitsi | `platforms/stubs.ts` | ۳ |
| BigBlueButton | `platforms/stubs.ts` | ۳ |

## Permissions

- `storage`, `activeTab`, `tabCapture`, `offscreen`, `notifications`
- `host_permissions`: `meet.google.com` (فاز ۱)

## توسعه

```bash
npm run dev:extension
```

Load: `apps/extension/.output/chrome-mv3`

Env: `WXT_API_URL`, `WXT_GOOSHA_APP_URL`

## Manual QA (Google Meet)

- [ ] نصب unpacked extension
- [ ] ورود OTP از popup
- [ ] join Meet → Consent → Recorder
- [ ] مکث / ادامه / پایان
- [ ] رونوشت در اپ Goosha
- [ ] tier بدون `meeting.record` → پیام upgrade
- [ ] لغو ضبط
- [ ] «نه، ممنون» → عدم نمایش مجدد در همان session

## Store

راهنمای انتشار: `apps/extension/store/README.md`

## UI

- Design tokens: `src/styles/tokens.css`
- مرجع بصری: `MeetingRecorderScreen.web.tsx` (موبایل/PWA)
- فونت: Vazirmatn لوکال در `public/fonts/`

## لینک‌ها

- [ضبط گوشا (PWA)](./goosha-recorder.md)
- [احراز هویت OTP](./auth-phone-otp.md)
- [رونویسی جلسه](./meeting-transcription.md)
