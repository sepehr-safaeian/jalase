import { describe, expect, it } from 'vitest';
import {
  applyReviewedTurns,
  isSafeReviewChange,
  parseReviewJson,
} from './transcript-review.util.js';
import type { TranscriptTurn } from '@jalase/shared';

const baseTurn: TranscriptTurn = {
  id: 't1',
  speakerId: 'speaker_0',
  speakerLabel: 'گوینده 1',
  startMs: 0,
  endMs: 3000,
  draftText: '',
  text: 'باید بررسی کنیم که جلسات هفوری داشته باشه',
  status: 'refined',
  chunkIndex: 0,
};

describe('transcript-review.util', () => {
  it('accepts small ASR corrections', () => {
    expect(
      isSafeReviewChange(
        'باید بررسی کنیم که جلسات هفوری داشته باشه',
        'باید بررسی کنیم که جلسات حضوری داشته باشه',
      ),
    ).toBe(true);
  });

  it('rejects full rewrite', () => {
    expect(
      isSafeReviewChange(
        'تایمستد هشکی سگوینده یه دایه باده',
        'یک لایه پردازش گوشمند برای استخراج تصمیم‌ها لازم است',
      ),
    ).toBe(false);
  });

  it('parses fenced JSON review payload', () => {
    const parsed = parseReviewJson(`
\`\`\`json
{
  "turns": [
    { "id": "t1", "text": "سلام" }
  ]
}
\`\`\`
`);

    expect(parsed).toEqual([{ id: 't1', text: 'سلام' }]);
  });

  it('applies only safe reviewed turns', () => {
    const reviewed = applyReviewedTurns(
      [baseTurn],
      [
        { id: 't1', text: 'باید بررسی کنیم که جلسات حضوری داشته باشه' },
      ],
    );

    expect(reviewed[0]?.text).toContain('حضوری');
    expect(reviewed[0]?.draftText).toContain('هفوری');
  });
});
