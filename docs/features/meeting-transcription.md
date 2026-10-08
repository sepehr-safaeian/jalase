# رونویسی زنده جلسه (Meeting Transcription)

> **معماری فعلی:** [hybrid-transcription-pipeline.md](./hybrid-transcription-pipeline.md)

## خلاصه

ضبط صدای زنده از مرورگر، pipeline هیبریدی diarize + transcribe، رونویسی speaker-attributed با timestamp.

## Env

```env
AVALAI_DIARIZE_MODEL=gpt-4o-transcribe-diarize
AVALAI_TRANSCRIBE_MODEL=gpt-4o-transcribe
AVALAI_HYBRID_PIPELINE=true
FFMPEG_PATH=   # اختیاری، برای برش segment چند گوینده
```

## Feature flags

- `meeting.record`
- `meeting.transcribe`
- `meeting.transcript.hybrid`
- `meeting.transcript.optimize` (Qwen، آینده)
