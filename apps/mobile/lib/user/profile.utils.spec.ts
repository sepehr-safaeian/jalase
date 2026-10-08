import { describe, expect, it } from 'vitest';
import {
  formatPhoneForDisplay,
  getUserInitials,
  resolveApiAssetUrl,
} from './profile.utils';

describe('profile.utils', () => {
  it('resolveApiAssetUrl مسیر نسبی را کامل می‌کند', () => {
    expect(resolveApiAssetUrl('/api/v1/uploads/avatars/u1.jpg')).toContain(
      '/api/v1/uploads/avatars/u1.jpg',
    );
    expect(resolveApiAssetUrl(null)).toBeNull();
  });

  it('formatPhoneForDisplay شماره ایران را فرمت می‌کند', () => {
    expect(formatPhoneForDisplay('+989123456789')).toBe('0912 345 6789');
  });

  it('getUserInitials حروف اول را برمی‌گرداند', () => {
    expect(getUserInitials('سپهر محمدی')).toBe('سم');
    expect(getUserInitials('سپهر')).toBe('سپ');
  });
});
