import { describe, expect, it } from 'vitest';
import {
  describeZibalStatus,
  describeZibalVerifyResult,
  isUserCancelledStatus,
} from './zibal-status.js';

describe('zibal-status', () => {
  it('maps known status codes to Persian messages', () => {
    expect(describeZibalStatus(3)).toBe('پرداخت لغو شد');
    expect(describeZibalVerifyResult(201)).toBe(
      'این پرداخت قبلا تایید شده است',
    );
  });

  it('detects user cancellation', () => {
    expect(isUserCancelledStatus(3)).toBe(true);
    expect(isUserCancelledStatus(5)).toBe(false);
  });
});
