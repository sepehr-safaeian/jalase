# ضبط گوشا (Meeting Recorder)

صفحه تمام‌صفحه ضبط جلسه با visualizer فرکانس واقعی و برند «گوشا».

## جریان کاربر

1. «جلسه جدید» → «همین الان» → **یادداشت** باز می‌شود (ادیتور).
2. کاربر «ضبط جلسه» را می‌زند → `/notes/:id/record` (گوشا).
3. ضبط خودکار شروع می‌شود؛ **مکث** وسط جلسه بدون قطع session (MediaRecorder.pause).
4. «پایان ضبط» → finalize → بازگشت به یادداشت با رونوشت.
5. دکمه «ضبط جلسه» دیگر نمایش داده نمی‌شود (یک بار ضبط).
6. **صدای جلسه** در انتهای یادداشت با `<audio controls>` (وب) قابل پخش است.

جلسات زمان‌بندی‌شده مستقیم به ادیتور می‌روند.

## API

- `POST .../recording/start`: اگر قبلاً ضبط شده → 400
- `POST .../recording/finalize`: فایل در `uploads/recordings/{noteId}.webm` + `recording_audio_url`

## کامپوننت‌ها

| مسیر | نقش |
|------|-----|
| `components/recorder/MeetingRecorderScreen.web.tsx` | گوشا + مکث/پایان |
| `components/recorder/AudioFrequencyVisualizer.web.tsx` | Canvas + Web Audio |
| `components/notes/NoteRecordingPlayer.web.tsx` | پخش صدای ضبط‌شده |
| `packages/shared/.../recording-utils.ts` | `noteHasCompletedRecording` |

## motion

- visualizer: rAF روی canvas
- دکمه‌ها: `scale(0.97)` روی فشار
- `prefers-reduced-motion`: smoothing کمتر

## افزونه مرورگر

برای جلسات آنلاین (Google Meet و ...): [goosha-extension.md](./goosha-extension.md)

## تست

- یادداشت جدید → ادیتور → ضبط → مکث → ادامه → پایان → دکمه ضبط حذف + پلیر صدا
