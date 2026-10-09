# Live Meeting Transcription

> **Current architecture:** [hybrid-transcription-pipeline.md](./hybrid-transcription-pipeline.md)

## Summary

Live audio capture from the browser, hybrid diarize + transcribe pipeline, speaker-attributed transcription with timestamps.

## Env

```env
DIARIZE_MODEL=gpt-4o-transcribe-diarize
ASR_MODEL=whisper-large-v3
HYBRID_PIPELINE=true
LLM_API_KEY=
LLM_BASE_URL=
FFMPEG_PATH=   # optional, for splitting multi-speaker segments
```

## Feature flags

- `meeting.record`
- `meeting.transcribe`
- `meeting.transcript.hybrid`
- `meeting.transcript.optimize` (Qwen, future)
