import { describe, expect, it } from 'vitest';
import { judgeFaithfulness } from './faithfulness-judge.js';

describe('judgeFaithfulness', () => {
  it('uses cached scores when live judge is disabled', async () => {
    const result = await judgeFaithfulness({
      meetingId: 'm1',
      transcript: 'We decided to ship next week.',
      summaryItems: ['Ship next week'],
      cached: { score: 5, rationale: 'cached' },
      allowLive: false,
    });
    expect(result.source).toBe('cached');
    expect(result.score).toBe(5);
  });

  it('falls back to heuristic support ratio', async () => {
    const result = await judgeFaithfulness({
      meetingId: 'm2',
      transcript:
        'The team approved the marketing budget increase and froze hiring until May.',
      summaryItems: [
        'Marketing budget increase was approved',
        'Hiring freeze until May',
      ],
      allowLive: false,
    });
    expect(result.source).toBe('heuristic');
    expect(result.score).toBeGreaterThanOrEqual(4);
  });
});
