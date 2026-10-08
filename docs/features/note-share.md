# Meeting Share

## Summary

On the meeting editor screen, the **Share** button in the header opens `NoteShareSheet` with these options:

| Option | Behavior |
|--------|----------|
| Copy | Full text + Jalase footer to clipboard |
| Download PDF | Styled HTML to PDF (native: real file, web: print) |
| Download MD | `.md` file |
| Telegram | deep link `t.me/share` |
| WhatsApp | deep link `wa.me` |
| SMS | `sms:?body=` |
| Other methods | System share sheet |

## Required footer

All exports include:

`Recorded with Jalase`

(See `GOOSHA_EXPORT_FOOTER` in `packages/shared/src/notes/note-export.ts`.)

## Shared

- `packages/shared/src/notes/note-export.ts`
- `buildNoteExportMarkdown`, `buildNoteExportHtml`, `docToMarkdown`

## Mobile

- `NoteShareSheet.tsx`
- `lib/notes/share-note.ts` (native)
- `lib/notes/share-note.web.ts` (web)

## Feature flag

`notes.share` (tier: free)

## Dependencies

- `expo-clipboard`
- `expo-file-system`
- `expo-sharing`
- `expo-print`
