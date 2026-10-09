# Smart meeting extraction

## Summary

For **recorded** meetings (no re-recording), a zap icon FAB opens a sheet with 4 options:

| kind | UI | Note section |
|------|-----|--------------|
| `summary` | Meeting summary | ## Summary |
| `decisions` | Decisions | ## Decisions |
| `next_actions` | Next steps | ## Next steps (task list) |
| `highlights` | Key points | ## Key points |

**Each kind runs only once** per note (`ai_extractions_json`).

## Philosophy: conservative, not list padding

Smart extraction is intentionally **cautious**:

- If the transcript is short or empty, the LLM is not called
- If decisions/actions/highlights are not clear, the section is filled with an honest message (not empty bullets)
- Each item must have `evidence` from the transcript + `confidence >= 0.75`
- Generic phrases and filler are rejected

### Empty-state messages

| kind | Default message |
|------|-----------------|
| `summary` | Not enough content to summarize. |
| `decisions` | No clear decisions were recorded in this meeting. |
| `next_actions` | No specific actions were extracted from this meeting. |
| `highlights` | No important points were found to record. |

## Pipeline

```
Transcript + kind
  → assessTranscriptSufficiency (fast-path for very short transcripts)
  → LLM JSON: { has_items, empty_reason, items[{text, evidence, confidence}] }
  → validateExtractionCandidates (evidence + confidence + anti-filler)
  → syncNoteSection (list or empty-state paragraph)
  → mark extraction used
```

## API

`POST /api/v1/notes/:id/extractions/:kind`

- Requires transcript
- LLM: OpenAI-compatible chat (`EXTRACT_MODEL`, requires `LLM_API_KEY` + `LLM_BASE_URL`)
- temperature: `0.05`
- Adaptive timeout: 30s / 60s / 90s based on transcript length
- Output in `contentJson` via `syncNoteSection`
- **Empty state is not an error**; extraction is still marked used

## DB

`notes.ai_extractions_json`: `{ "summary": "2026-08-31T..." }`

## Feature flag

`meeting.insights`

## UI

- `MeetingInsightFab`: circular FAB, zap icon, subtle yellow halo
- `MeetingInsightSheet`: formal cards with "Done" badge
- Client: 120s timeout for extraction requests

## Tests

- `packages/shared/src/notes/meeting-extractions.spec.ts`
- `apps/api/src/notes/meeting-extraction.service.spec.ts`
