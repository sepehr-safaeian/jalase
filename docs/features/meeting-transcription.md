# Live Meeting Transcription

> **Current architecture:** [hybrid-transcription-pipeline.md](./hybrid-transcription-pipeline.md)

## Summary

Live audio capture from the browser, hybrid diarize + transcribe pipeline, speaker-attributed transcription with timestamps.

## Env

```env
AVALAI_DIARIZE_MODEL=gpt-4o-transcribe-diarize
AVALAI_TRANSCRIBE_MODEL=gpt-4o-transcribe
AVALAI_HYBRID_PIPELINE=true
FFMPEG_PATH=   # optional, for splitting multi-speaker segments
```

## Feature flags

- `meeting.record`
- `meeting.transcribe`
- `meeting.transcript.hybrid`
- `meeting.transcript.optimize` (Qwen, future)
