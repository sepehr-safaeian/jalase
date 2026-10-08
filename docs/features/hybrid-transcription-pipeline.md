# معماری هیبریدی رونویسی جلسه

## فلسفه: سه لایه جدا

| لایه | نقش | مدل |
|------|-----|-----|
| **WHO** | گوینده + زمان | `gpt-4o-transcribe-diarize` |
| **WHAT** | متن دقیق (شنیدن دوباره audio) | `gpt-4o-transcribe` |
| **SO WHAT** | تصمیم، اقدام، خلاصه (آینده) | Qwen + feature flag optimize |

```
🎙️ Audio chunk
       │
       ▼
gpt-4o-transcribe-diarize
       │
 speaker + timestamps + draft text
       │
 ┌─────┴─────┐
 │           │
 ▼           ▼
segments   audio slices (ffmpeg)
 │           │
 └─────┬─────┘
       ▼
 gpt-transcribe (per segment)
       │
       ▼
 Alignment / Merge
       │
       ▼
 Speaker-attributed final transcript
```

## چرا re-transcribe روی audio segment؟

Diarization گاهی متن rough می‌دهد:

> «های عملکرد هوش مصنوعی در اتوم تبدیل صدا به متن نوافتاد»

صدا واقعی:

> «های، عملکرد هوش مصنوعی در اتوماسیون تبدیل صدا به متن نودافتاد...»

**اشتباه:** diarize → متن خراب → LLM حدس بزند  
**درست:** diarize → speaker + timestamp → **همان بازه audio** → gpt-transcribe → متن واقعی

## پیاده‌سازی فعلی (v1)

### Live (هر ۳ ثانیه)

1. Client: `MediaRecorder` segment کامل webm
2. API: `HybridTranscriptionPipeline.processChunk()`
3. Diarize کل chunk → segments
4. برای هر segment:
   - برش audio با ffmpeg (اگر چند گوینده)
   - `gpt-4o-transcribe` روی همان slice
5. Merge turns در `transcript_segments_json`
6. UI: `[MM:SS] گوینده N: متن` با draft → refined

### فایل‌های کلیدی

```
apps/api/src/transcription/
  avalai.service.ts              # diarize + transcribe
  audio-slice.service.ts         # ffmpeg segment extraction
  hybrid-transcription.pipeline.ts
  transcription.service.ts       # orchestration + persistence

packages/shared/src/notes/
  transcript-segments.ts         # TranscriptTurn types + merge
```

### Env

```env
AVALAI_DIARIZE_MODEL=gpt-4o-transcribe-diarize
AVALAI_TRANSCRIBE_MODEL=gpt-4o-transcribe
AVALAI_HYBRID_PIPELINE=true
```

### Feature flag

- `meeting.transcript.hybrid` (dev: enabled)

## Roadmap

### v2: Batch alignment (کاهش API call)

```
Diarization → 5–10 speaker segments
       ↓
یک audio chunk بزرگ‌تر
       ↓
یک gpt-transcribe + word timestamps
       ↓
alignment با timestamp → speaker
```

### v3: Live incremental refine

```
[10:32:14] گوینده 2 · پیش‌نویس
به نظر من باید پروژه رو...

        ↓ (segment complete)

[10:32:14] گوینده 2
به نظر من باید پروژه را از هفته آینده شروع کنیم.
```

### v4: Speaker → Member mapping

- Map `speaker_0` به `NoteMember.displayName`
- UI: نام واقعی به‌جای «گوینده ۱»

### v5: Optimize (Qwen)

- Feature flag `meeting.transcript.optimize`
- فقط روی متن نهایی، نه live
- اصلاح املا + استخراج decision/action

### v6: Benchmark pipeline

```
Same audio → Diarize | gpt-transcribe | Scribe | ...
                    ↓
               Evaluation → best pipeline
```

## هزینه (تخمینی)

جلسه ۶۰ دقیقه:

- Diarization: ~۶۰ min processing
- Transcription: ~۶۰ min processing (یک بار per segment در v1، کمتر در v2)

~$0.27/hour فقط transcribe (در $0.0045/min) اگر کیفیت بهتر شود، ارزش محصولی دارد.

## تست

- `hybrid-transcription.pipeline.spec.ts`
- `transcription.service.spec.ts`
- `transcript-segments.spec.ts`
