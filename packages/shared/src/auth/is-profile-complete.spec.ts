import { describe, expect, it } from 'vitest';
import { isProfileComplete } from './is-profile-complete.js';

describe('isProfileComplete', () => {
  it('نام خالی را ناقص می‌داند', () => {
    expect(isProfileComplete({ firstName: null, displayName: null })).toBe(false);
    expect(isProfileComplete({ firstName: '', displayName: '' })).toBe(false);
    expect(isProfileComplete({ firstName: '   ', displayName: '   ' })).toBe(false);
  });

  it('نام معتبر را کامل می‌داند', () => {
    expect(isProfileComplete({ firstName: 'سپهر', displayName: null })).toBe(true);
    expect(isProfileComplete({ firstName: null, displayName: 'سپهر' })).toBe(true);
  });
});
