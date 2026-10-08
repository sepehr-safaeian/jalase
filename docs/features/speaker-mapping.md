# نام‌گذاری گوینندگان رونوشت

## خلاصه

کاربر از chip **اعضا** وارد sheet می‌شود و برای هر گوینده شناسایی‌شده (مثل `گوینده A`) نام واقعی (مثل «سپهر صفائیان») می‌نویسد. نام در **کل رونوشت** جایگزین می‌شود:

- `transcriptTurns` (API)
- `transcriptText`
- بخش «رونوشت جلسه» در Tiptap
- خروجی Share (MD/PDF)

## مدل

- `notes.speaker_name_mappings_json`: `{ "speaker_0": "سپهر صفائیان" }`
- `speakerId` پایدار از diarization؛ label پیش‌فرض: `گوینده A` … `Z` سپس عددی

## API

`PATCH /api/v1/notes/:id/speaker-mappings`

```json
{
  "mappings": {
    "speaker_0": "سپهر صفائیان",
    "speaker_1": "علی رضایی"
  }
}
```

## UI

`NoteMembersSheet`: بخش «گوینندگان رونوشت» + بخش اعضای جلسه

## Shared

`packages/shared/src/notes/speaker-mappings.ts`

## Feature flag

`meeting.transcript.speaker-mapping`
