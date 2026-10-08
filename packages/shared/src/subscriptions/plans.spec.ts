import { describe, expect, it } from 'vitest';
import {
  BILLING_PERIODS,
  calculateAddonOrderAmountToman,
  calculateOrderAmountToman,
  getOrderMonths,
  planToTier,
  resolveAiMonthlyLimit,
} from './plans.js';

describe('subscription plans', () => {
  it('قیمت سفارش را از نرخ ماهانه محاسبه می‌کند', () => {
    expect(calculateOrderAmountToman('plus', '3m')).toBe(149_000 * 3);
    expect(calculateOrderAmountToman('pro', '1y')).toBe(499_000 * 12);
    expect(calculateOrderAmountToman('free', '3m')).toBe(0);
  });

  it('قیمت پکیج توربو را محاسبه می‌کند', () => {
    expect(calculateAddonOrderAmountToman('turbo', '3m')).toBe(299_000 * 3);
  });

  it('پلن یک‌ساله ۱۴ ماه اعتبار می‌دهد', () => {
    expect(getOrderMonths('1y')).toEqual({ monthsPaid: 12, monthsGranted: 14 });
    expect(BILLING_PERIODS['1y'].monthsGranted).toBe(14);
  });

  it('planToTier نگاشت درست دارد', () => {
    expect(planToTier('free')).toBe('free');
    expect(planToTier('plus')).toBe('plus');
    expect(planToTier('pro')).toBe('pro');
    expect(planToTier('personal')).toBe('plus');
    expect(planToTier('team')).toBe('pro');
  });

  it('توربو فعال سقف AI را نامحدود می‌کند', () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(resolveAiMonthlyLimit('plus', true, future)).toBeNull();
    expect(resolveAiMonthlyLimit('plus', false, future)).toBe(10);
    expect(resolveAiMonthlyLimit('free', true, future)).toBe(0);
  });
});
