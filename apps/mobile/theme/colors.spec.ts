import { describe, expect, it } from 'vitest';
import { colors, palette, radius, spacing } from './tokens';

describe('theme tokens', () => {
  it('canvas paper-like در light mode', () => {
    expect(colors.light.canvas).toBe('#F7F7F2');
    expect(colors.light.background).toBe(palette.canvas);
  });

  it('سبز برند به‌عنوان primary', () => {
    expect(colors.light.primary).toBe('#187A45');
    expect(colors.light.primaryMid).toBe('#22A35D');
  });

  it('radius مطابق Design Language', () => {
    expect(radius.md).toBe(8);
    expect(radius.pill).toBeGreaterThan(100);
  });

  it('spacing base unit 4px', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.section).toBe(64);
    expect(spacing.cardPadding).toBe(24);
  });
});
