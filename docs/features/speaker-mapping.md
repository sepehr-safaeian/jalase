# Transcript Speaker Naming

## Summary

From the **Members** chip, the user opens a sheet and assigns a real name (for example "Sepehr Safaian") to each detected speaker (for example `Speaker A`). The name is replaced **throughout the transcript**:

- `transcriptTurns` (API)
- `transcriptText`
- The "Meeting transcript" section in Tiptap
- Share output (MD/PDF)

## Model

- `notes.speaker_name_mappings_json`: `{ "speaker_0": "Sepehr Safaian" }`
- Stable `speakerId` from diarization; default label: `Speaker A` … `Z`, then numeric

## API

`PATCH /api/v1/notes/:id/speaker-mappings`

```json
{
  "mappings": {
    "speaker_0": "Sepehr Safaian",
    "speaker_1": "Ali Rezaei"
  }
}
```

## UI

`NoteMembersSheet`: "Transcript speakers" section plus meeting members section

## Shared

`packages/shared/src/notes/speaker-mappings.ts`

## Feature flag

`meeting.transcript.speaker-mapping`
