import { describe, expect, it } from 'vitest';
import { isDisplayVariant, typography } from './typography';

describe('typography', () => {
  it('display variants برای hierarchy بزرگ‌تر هستند', () => {
    expect(isDisplayVariant('headingLg')).toBe(true);
    expect(isDisplayVariant('body')).toBe(false);
    expect(typography.headingLg.fontSize).toBeGreaterThan(typography.body.fontSize);
  });

  it('display scale تعریف شده', () => {
    expect(typography.display.fontSize).toBe(68);
    expect(typography.display.lineHeight).toBe(68);
  });
});
