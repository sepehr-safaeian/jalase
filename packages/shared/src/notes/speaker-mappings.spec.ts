import { describe, it, expect } from 'vitest';
import type { TranscriptTurn } from './transcript-segments.js';
import {
  applySpeakerMappingsToTurns,
  buildSpeakerProfiles,
  resolveSpeakerDisplayName,
} from './speaker-mappings.js';
import { turnsToFlatTranscript } from './transcript-segments.js';

const turn: TranscriptTurn = {
  id: 't1',
  speakerId: 'speaker_0',
  speakerLabel: 'گوینده A',
  startMs: 4000,
  endMs: 9000,
  draftText: '',
  text: 'سلام',
  status: 'refined',
  chunkIndex: 0,
};

describe('speaker-mappings', () => {
  it('resolveSpeakerDisplayName نام سفارشی را برمی‌گرداند', () => {
    expect(
      resolveSpeakerDisplayName('speaker_0', 'گوینده A', {
        speaker_0: 'سپهر صفائیان',
      }),
    ).toBe('سپهر صفائیان');
  });

  it('applySpeakerMappingsToTurns در flat transcript اعمال می‌شود', () => {
    const mapped = applySpeakerMappingsToTurns([turn], {
      speaker_0: 'سپهر صفائیان',
    });
    const flat = turnsToFlatTranscript(mapped);

    expect(flat).toContain('سپهر صفائیان:');
    expect(flat).not.toContain('گوینده A:');
  });

  it('buildSpeakerProfiles لیست گوینندگان یکتا می‌سازد', () => {
    const profiles = buildSpeakerProfiles([turn, { ...turn, id: 't2' }], {
      speaker_0: 'سپهر صفائیان',
    });

    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.displayName).toBe('سپهر صفائیان');
  });
});
