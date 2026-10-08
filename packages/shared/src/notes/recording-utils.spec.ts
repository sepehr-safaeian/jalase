import { describe, expect, it } from 'vitest';
import { noteHasCompletedRecording } from './recording-utils.js';

describe('noteHasCompletedRecording', () => {
  it('returns false for empty note', () => {
    expect(
      noteHasCompletedRecording({ transcriptText: '', recordingAudioUrl: null }),
    ).toBe(false);
  });

  it('returns true when transcript exists', () => {
    expect(
      noteHasCompletedRecording({
        transcriptText: 'سلام',
        recordingAudioUrl: null,
      }),
    ).toBe(true);
  });

  it('returns true when audio url exists', () => {
    expect(
      noteHasCompletedRecording({
        transcriptText: '',
        recordingAudioUrl: '/api/v1/uploads/recordings/id.webm',
      }),
    ).toBe(true);
  });
});
