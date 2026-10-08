# اشتراک‌گذاری جلسه

## خلاصه

در صفحه ادیتور جلسه، دکمه **Share** در header باز می‌کند `NoteShareSheet` با گزینه‌های:

| گزینه | رفتار |
|-------|--------|
| کپی | متن کامل + فوتر گوشا در کلیپ‌بورد |
| دانلود PDF | HTML شکیل → PDF (native: فایل واقعی، web: چاپ) |
| دانلود MD | فایل `.md` |
| تلگرام | deep link `t.me/share` |
| واتساپ | deep link `wa.me` |
| SMS | `sms:?body=` |
| سایر روش‌ها | Share sheet سیستم |

## فوتر اجباری

همه خروجی‌ها شامل:

`ضبط شده توسط گوشا (Goosha.app)`

## Shared

- `packages/shared/src/notes/note-export.ts`
- `buildNoteExportMarkdown`, `buildNoteExportHtml`, `docToMarkdown`

## Mobile

- `NoteShareSheet.tsx`
- `lib/notes/share-note.ts` (native)
- `lib/notes/share-note.web.ts` (web)

## Feature flag

`notes.share` (tier: free)

## وابستگی‌ها

- `expo-clipboard`
- `expo-file-system`
- `expo-sharing`
- `expo-print`
