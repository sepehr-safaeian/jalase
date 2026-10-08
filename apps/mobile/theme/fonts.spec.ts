import { describe, expect, it } from 'vitest';
import { fontFamily, resolveFontFamily } from './font-family';

describe('font-family', () => {
  it('خانواده فونت Vazirmatn تعریف شده', () => {
    expect(fontFamily.regular).toBe('Vazirmatn-Regular');
    expect(fontFamily.bold).toBe('Vazirmatn-Bold');
  });

  it('resolveFontFamily وزن را به فایل درست map می‌کند', () => {
    expect(resolveFontFamily('400')).toBe('Vazirmatn-Regular');
    expect(resolveFontFamily('600')).toBe('Vazirmatn-SemiBold');
    expect(resolveFontFamily('bold')).toBe('Vazirmatn-Bold');
  });
});
