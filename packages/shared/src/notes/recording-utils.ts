import type { NoteDetail } from './types.js';

/** جلسه قبلاً ضبط و نهایی شده (یک بار ضبط مجاز است). */
export function noteHasCompletedRecording(
  note: Pick<NoteDetail, 'transcriptText' | 'recordingAudioUrl'>,
): boolean {
  if (note.recordingAudioUrl?.trim()) {
    return true;
  }
  return Boolean(note.transcriptText?.trim());
}
