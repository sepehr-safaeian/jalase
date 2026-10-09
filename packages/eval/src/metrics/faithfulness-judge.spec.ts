import { describe, expect, it } from 'vitest';
import { judgeFaithfulness } from './faithfulness-judge.js';

describe('judgeFaithfulness', () => {
  it('uses heuristic support ratio offline', async () => {
    const result = await judgeFaithfulness({
      meetingId: 'synthetic-03',
      transcript:
        'The team approved the marketing budget increase and froze hiring until May.',
      summaryItems: [
        'Marketing budget increase was approved',
        'Hiring freeze until May',
      ],
      allowLive: false,
    });
    expect(result.source).toBe('heuristic');
    expect(result.supportedRate).toBeGreaterThanOrEqual(0.5);
  });

  it('returns absent for empty summaries', async () => {
    const result = await judgeFaithfulness({
      meetingId: 'empty',
      transcript: 'Anything',
      summaryItems: [],
      allowLive: false,
    });
    expect(result.source).toBe('absent');
    expect(result.itemCount).toBe(0);
  });
});
