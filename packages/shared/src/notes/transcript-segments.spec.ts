import { describe, expect, it } from 'vitest';
import {
  formatSpeakerLabel,
  formatTranscriptClock,
  formatTurnLine,
  mergeTranscriptTurns,
  turnsToFlatTranscript,
} from './transcript-segments.js';
import type { TranscriptTurn } from './transcript-segments.js';

describe('transcript-segments', () => {
  it('formats clock', () => {
    expect(formatTranscriptClock(125_000)).toBe('02:05');
    expect(formatTranscriptClock(3_661_000)).toBe('1:01:01');
  });

  it('formats speaker label', () => {
    expect(formatSpeakerLabel('speaker_0')).toBe('گوینده A');
    expect(formatSpeakerLabel('speaker_3')).toBe('گوینده D');
    expect(formatSpeakerLabel('speaker_26')).toBe('گوینده 27');
  });

  it('formats turn line with timestamp', () => {
    const line = formatTurnLine({
      startMs: 32_000,
      speakerLabel: 'گوینده 2',
      text: 'سلام',
      draftText: 'سل',
      status: 'refined',
    });
    expect(line).toBe('[00:32] گوینده 2: سلام');
  });

  it('merges turns by id', () => {
    const existing: TranscriptTurn[] = [
      {
        id: 'a',
        speakerId: 'speaker_0',
        speakerLabel: 'گوینده 1',
        startMs: 0,
        endMs: 1000,
        draftText: 'قد',
        text: 'قد',
        status: 'draft',
        chunkIndex: 0,
      },
    ];
    const incoming: TranscriptTurn[] = [
      {
        id: 'a',
        speakerId: 'speaker_0',
        speakerLabel: 'گوینده 1',
        startMs: 0,
        endMs: 1000,
        draftText: 'قد',
        text: 'قدیمی',
        status: 'refined',
        chunkIndex: 0,
      },
      {
        id: 'b',
        speakerId: 'speaker_1',
        speakerLabel: 'گوینده 2',
        startMs: 2000,
        endMs: 3000,
        draftText: 'جد',
        text: 'جدید',
        status: 'refined',
        chunkIndex: 1,
      },
    ];
    const merged = mergeTranscriptTurns(existing, incoming);
    expect(merged).toHaveLength(2);
    expect(merged.find((t) => t.id === 'a')?.text).toBe('قدیمی');
    expect(turnsToFlatTranscript(merged)).toContain('گوینده 2: جدید');
  });
});
