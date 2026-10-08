import { describe, expect, it } from 'vitest';
import { parsePreferencesForTest } from './settings-storage.test-utils';

describe('settings storage parsing', () => {
  it('مقادیر پیش‌فرض را برمی‌گرداند', () => {
    expect(parsePreferencesForTest(null)).toEqual({
      theme: 'light',
      fontSize: 'medium',
      locale: 'en',
    });
  });

  it('مقادیر معتبر را parse می‌کند', () => {
    expect(
      parsePreferencesForTest(
        JSON.stringify({ theme: 'dark', fontSize: 'large', locale: 'fa' }),
      ),
    ).toEqual({
      theme: 'dark',
      fontSize: 'large',
      locale: 'fa',
    });
  });
});
