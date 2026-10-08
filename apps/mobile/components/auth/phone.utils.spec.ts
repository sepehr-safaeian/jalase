import { describe, expect, it } from 'vitest';
import { isValidIranPhone, toIranE164, formatIranPhoneDisplay } from './phone.utils';

describe('phone.utils', () => {
  it('شماره 09... را به E.164 تبدیل می‌کند', () => {
    expect(toIranE164('09123456789')).toBe('+989123456789');
  });

  it('شماره نامعتبر را رد می‌کند', () => {
    expect(toIranE164('08123456789')).toBeNull();
    expect(isValidIranPhone('123')).toBe(false);
  });

  it('شماره را برای نمایش LTR فرمت می‌کند', () => {
    expect(formatIranPhoneDisplay('09157081168')).toBe('0915 708 1168');
    expect(formatIranPhoneDisplay('+989157081168')).toBe('0915 708 1168');
  });
});
