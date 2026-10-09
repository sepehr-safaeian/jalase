# Hybrid meeting transcription architecture

## Philosophy: three separate layers

| Layer | Role | Model |
|-------|------|-------|
| **WHO** | Speaker + time | `gpt-4o-transcribe-diarize` |
| **WHAT** | Accurate text (re-listening to audio) | `gpt-4o-transcribe` |
| **SO WHAT** | Decisions, actions, summary (future) | Qwen + feature flag optimize |

```
Audio chunk
       |
       v
gpt-4o-transcribe-diarize
       |
 speaker + timestamps + draft text
       |
 +-----+-----+
 |           |
 v           v
segments   audio slices (ffmpeg)
 |           |
 +-----+-----+
       v
 gpt-transcribe (per segment)
       |
       v
 Alignment / Merge
       |
       v
 Speaker-attributed final transcript
```

## Why re-transcribe on audio segments?

Diarization sometimes produces rough text. Example (Persian speech):

> "های عملکرد هوش مصنوعی در اتوم تبدیل صدا به متن نوافتاد"

Actual speech:

> "های، عملکرد هوش مصنوعی در اتوماسیون تبدیل صدا به متن نودافتاد..."

(Gloss: diarized draft garbles "automation" and word boundaries; the refined pass restores the intended sentence.)

**Wrong:** diarize → bad text → LLM guesses  
**Right:** diarize → speaker + timestamp → **same audio window** → gpt-transcribe → real text

## Current implementation (v1)

### Live (every 3 seconds)

1. Client: full webm segment via `MediaRecorder`
2. API: `HybridTranscriptionPipeline.processChunk()`
3. Diarize entire chunk → segments
4. For each segment:
   - Trim audio with ffmpeg (if multiple speakers)
   - `gpt-4o-transcribe` on that slice
5. Merge turns in `transcript_segments_json`
6. UI: `[MM:SS] Speaker N: text` with draft → refined

### Key files

```
apps/api/src/transcription/
  openai-compatible.client.ts    # diarize + transcribe
  audio-slice.service.ts         # ffmpeg segment extraction
  hybrid-transcription.pipeline.ts
  transcription.service.ts       # orchestration + persistence

packages/shared/src/notes/
  transcript-segments.ts         # TranscriptTurn types + merge
```

### Env

```env
DIARIZE_MODEL=gpt-4o-transcribe-diarize
ASR_MODEL=whisper-large-v3
HYBRID_PIPELINE=true
LLM_API_KEY=
LLM_BASE_URL=
```

### Feature flag

- `meeting.transcript.hybrid` (dev: enabled)

## Roadmap

### v2: Batch alignment (fewer API calls)

```
Diarization → 5-10 speaker segments
       ↓
One larger audio chunk
       ↓
One gpt-transcribe + word timestamps
       ↓
Alignment with timestamp → speaker
```

### v3: Live incremental refine

```
[10:32:14] Speaker 2 · draft
به نظر من باید پروژه رو...
(In English: "I think we should start the project...")

        ↓ (segment complete)

[10:32:14] Speaker 2
به نظر من باید پروژه را از هفته آینده شروع کنیم.
(In English: "I think we should start the project from next week.")
```

### v4: Speaker → Member mapping

- Map `speaker_0` to `NoteMember.displayName`
- UI: real name instead of "Speaker 1"

### v5: Optimize (Qwen)

- Feature flag `meeting.transcript.optimize`
- Only on final text, not live
- Spelling fixes + decision/action extraction

### v6: Benchmark pipeline

```
Same audio → Diarize | gpt-transcribe | Scribe | ...
                    ↓
               Evaluation → best pipeline
```

## Cost (estimate)

60-minute meeting:

- Diarization: ~60 min processing
- Transcription: ~60 min processing (once per segment in v1, less in v2)

~$0.27/hour transcribe-only (at $0.0045/min); if quality improves, product value increases.

## Tests

- `hybrid-transcription.pipeline.spec.ts`
- `transcription.service.spec.ts`
- `transcript-segments.spec.ts`
