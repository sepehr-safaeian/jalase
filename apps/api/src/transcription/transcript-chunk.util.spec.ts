import { describe, expect, it } from 'vitest';
import {
  extractNewTranscriptDelta,
  isLikelyHallucination,
  stripPromptArtifacts,
} from './transcript-chunk.util.js';

describe('transcript-chunk.util', () => {
  it('removes prompt artifacts', () => {
    const raw =
      'تست شماره یک. گوینده‌ها را با «گوینده ۱»، «گوینده ۲» برچسب بزن.';
    expect(stripPromptArtifacts(raw)).toBe('تست شماره یک.');
  });

  it('skips chunk fully contained in existing transcript', () => {
    const existing = 'تست شماره یک محتوای جلسه اول';
    const chunk = 'تست شماره یک محتوای جلسه اول';
    expect(extractNewTranscriptDelta(existing, chunk)).toBe('');
  });

  it('extracts only new suffix', () => {
    const existing = 'سلام وقت بخیر';
    const chunk = 'وقت بخیر امروز درباره بودجه صحبت کردیم';
    expect(extractNewTranscriptDelta(existing, chunk)).toBe(
      'امروز درباره بودجه صحبت کردیم',
    );
  });

  it('detects hallucination loops', () => {
    expect(isLikelyHallucination('abc abc abc abc abc', '')).toBe(true);
  });
});
