import { describe, expect, it } from 'vitest';
import { aggregateExtractionF1, scoreExtractionKind } from './extraction-f1.js';

describe('scoreExtractionKind', () => {
  it('matches paraphrases above Jaccard threshold', () => {
    const result = scoreExtractionKind(
      'm1',
      'decisions',
      ['Ship beta by March fifteenth'],
      ['Ship the beta by March fifteenth'],
    );
    expect(result.matched).toBe(1);
    expect(result.f1).toBe(1);
  });

  it('scores empty vs empty as perfect', () => {
    const result = scoreExtractionKind('m2', 'next_actions', [], []);
    expect(result.f1).toBe(1);
  });
});

describe('aggregateExtractionF1', () => {
  it('aggregates micro F1 across meetings', () => {
    const rows = [
      scoreExtractionKind('a', 'decisions', ['one two'], ['one two']),
      scoreExtractionKind('b', 'decisions', ['alpha'], ['beta gamma']),
    ];
    const agg = aggregateExtractionF1(rows);
    expect(agg.precision).toBeCloseTo(0.5);
    expect(agg.recall).toBeCloseTo(0.5);
  });
});
