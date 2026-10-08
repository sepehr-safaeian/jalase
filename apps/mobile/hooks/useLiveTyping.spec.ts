import { describe, expect, it } from 'vitest';
import { useLiveTyping } from './useLiveTyping';

describe('useLiveTyping', () => {
  it('exports hook function', () => {
    expect(typeof useLiveTyping).toBe('function');
  });
});
