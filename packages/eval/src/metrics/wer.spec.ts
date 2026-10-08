import { describe, expect, it } from 'vitest';
import { computeWer, meanWer } from './wer.js';

describe('computeWer', () => {
  it('returns zero for identical transcripts', () => {
    const result = computeWer('hello world', 'hello world', 'm1');
    expect(result.wer).toBe(0);
    expect(result.cer).toBe(0);
    expect(result.nWords).toBe(2);
  });

  it('counts a single substitution', () => {
    const result = computeWer('hello world', 'hello there', 'm2');
    expect(result.substitutions).toBe(1);
    expect(result.wer).toBeCloseTo(0.5);
  });

  it('ignores punctuation and case', () => {
    const result = computeWer('Hello, World!', 'hello world', 'm3');
    expect(result.wer).toBe(0);
  });
});

describe('meanWer', () => {
  it('weights by reference word count', () => {
    const a = computeWer('a b c d', 'a b c x', 'a');
    const b = computeWer('a', 'b', 'b');
    const { mean } = meanWer([a, b]);
    expect(mean).toBeCloseTo((0.25 * 4 + 1 * 1) / 5);
  });
});
