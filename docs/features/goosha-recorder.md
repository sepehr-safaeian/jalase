# Jalase meeting recorder

Full-screen meeting recording page with a real frequency visualizer and Jalase branding.

## User flow

1. "New meeting" → "Right now" → **note** opens (editor).
2. User taps "Record meeting" → `/notes/:id/record` (recorder).
3. Recording starts automatically; **pause** mid-meeting without ending the session (`MediaRecorder.pause`).
4. "Stop recording" → finalize → return to note with transcript.
5. "Record meeting" button is hidden afterward (single recording).
6. **Meeting audio** at the end of the note is playable via `<audio controls>` (web).

Scheduled meetings go straight to the editor.

## API

- `POST .../recording/start`: if already recorded → 400
- `POST .../recording/finalize`: file at `uploads/recordings/{noteId}.webm` + `recording_audio_url`

## Components

| Path | Role |
|------|------|
| `components/recorder/MeetingRecorderScreen.web.tsx` | Recorder + pause/stop |
| `components/recorder/AudioFrequencyVisualizer.web.tsx` | Canvas + Web Audio |
| `components/notes/NoteRecordingPlayer.web.tsx` | Play recorded audio |
| `packages/shared/.../recording-utils.ts` | `noteHasCompletedRecording` |

## Motion

- Visualizer: rAF on canvas
- Buttons: `scale(0.97)` on press
- `prefers-reduced-motion`: reduced smoothing

## Browser extension

For online meetings (Google Meet, etc.): [goosha-extension.md](./goosha-extension.md)

## Tests

- New note → editor → record → pause → resume → stop → record button removed + audio player
