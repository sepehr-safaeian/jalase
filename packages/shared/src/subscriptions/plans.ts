import type {
  AddonDefinition,
  AddonKey,
  BillingPeriodDefinition,
  BillingPeriodKey,
  PlanDefinition,
  PlanKey,
} from './types.js';
import type { Tier } from '../types/tier.js';

export const BILLING_PERIODS: Record<BillingPeriodKey, BillingPeriodDefinition> =
  {
    '3m': {
      key: '3m',
      label: '۳ ماهه',
      monthsPaid: 3,
      monthsGranted: 3,
    },
    '6m': {
      key: '6m',
      label: '۶ ماهه',
      monthsPaid: 6,
      monthsGranted: 6,
    },
    '1y': {
      key: '1y',
      label: 'یک‌ساله',
      monthsPaid: 12,
      monthsGranted: 14,
      badge: '+۲ ماه هدیه',
    },
  };

export const PLAN_CATALOG: Record<PlanKey, PlanDefinition> = {
  free: {
    key: 'free',
    tier: 'free',
    name: 'رایگان',
    tagline: 'یادداشت‌برداری دستی برای جلسات حضوری',
    monthlyPriceToman: 0,
    aiMonthlyLimit: 0,
    features: [
      { key: 'manual_notes', label: 'یادداشت‌برداری دستی', included: true },
      {
        key: 'in_person',
        label: 'مناسب برای جلسات حضوری',
        included: true,
      },
      {
        key: 'ai',
        label: 'هوش مصنوعی',
        included: false,
      },
      {
        key: 'meeting_connect',
        label: 'اتصال به نرم‌افزار جلسه آنلاین',
        included: false,
      },
      {
        key: 'share',
        label: 'اشتراک‌گذاری جلسه',
        included: false,
      },
    ],
    meetingIntegrations: [],
  },
  plus: {
    key: 'plus',
    tier: 'plus',
    name: 'پلاس',
    tagline: 'جلسات حضوری و آنلاین با هوش مصنوعی',
    monthlyPriceToman: 149_000,
    aiMonthlyLimit: 10,
    features: [
      { key: 'manual_notes', label: 'یادداشت‌برداری دستی', included: true },
      {
        key: 'meeting_types',
        label: 'مناسب برای جلسات حضوری و آنلاین',
        included: true,
      },
      {
        key: 'ai_monthly',
        label: 'هوش مصنوعی تا ۱۰ بار در ماه',
        included: true,
      },
      {
        key: 'meeting_connect',
        label: 'اتصال به Google Meet و Zoom',
        included: true,
      },
      {
        key: 'share',
        label: 'اشتراک‌گذاری جلسه',
        included: true,
      },
    ],
    meetingIntegrations: ['Google Meet', 'Zoom'],
  },
  pro: {
    key: 'pro',
    tier: 'pro',
    name: 'پرو',
    tagline: 'همه اتصالات جلسه + هوش مصنوعی بیشتر',
    monthlyPriceToman: 499_000,
    aiMonthlyLimit: 30,
    features: [
      { key: 'manual_notes', label: 'یادداشت‌برداری دستی', included: true },
      {
        key: 'meeting_types',
        label: 'مناسب برای جلسات حضوری و آنلاین',
        included: true,
      },
      {
        key: 'ai_monthly',
        label: 'هوش مصنوعی تا ۳۰ بار در ماه',
        included: true,
      },
      {
        key: 'meeting_connect',
        label: 'اتصال به Google Meet، Zoom، Skype، Jitsi و BigBlueButton',
        included: true,
      },
      {
        key: 'share',
        label: 'اشتراک‌گذاری جلسه',
        included: true,
      },
    ],
    meetingIntegrations: [
      'Google Meet',
      'Zoom',
      'Skype',
      'Jitsi',
      'BigBlueButton',
    ],
  },
};

export const TURBO_ADDON: AddonDefinition = {
  key: 'turbo',
  name: 'توربو',
  tagline: 'هوش مصنوعی نامحدود برای جلسات پرتعداد',
  monthlyPriceToman: 299_000,
  requiresPaidPlan: true,
  features: [
    {
      key: 'ai_unlimited',
      label: 'استفاده نامحدود از هوش مصنوعی',
      included: true,
    },
    {
      key: 'requires_paid',
      label: 'نیاز به اشتراک فعال پلاس یا پرو',
      included: true,
    },
  ],
};

export const ADDON_CATALOG: Record<AddonKey, AddonDefinition> = {
  turbo: TURBO_ADDON,
};

export const PAID_PLAN_KEYS: PlanKey[] = ['plus', 'pro'];

/** نگاشت کلیدهای قدیمی پلن */
const LEGACY_PLAN_KEYS: Record<string, PlanKey> = {
  personal: 'plus',
  team: 'pro',
};

export function normalizePlanKey(key: string): PlanKey {
  return (LEGACY_PLAN_KEYS[key] ?? key) as PlanKey;
}

export function planToTier(planKey: PlanKey | string): Tier {
  const normalized = normalizePlanKey(planKey);
  return PLAN_CATALOG[normalized].tier;
}

export function isPaidPlan(planKey: PlanKey | string): boolean {
  const normalized = normalizePlanKey(planKey);
  return normalized !== 'free';
}

export function listPlans(): PlanDefinition[] {
  return Object.values(PLAN_CATALOG);
}

export function listAddons(): AddonDefinition[] {
  return Object.values(ADDON_CATALOG);
}

export function listBillingPeriods(): BillingPeriodDefinition[] {
  return Object.values(BILLING_PERIODS);
}

export function calculateOrderAmountToman(
  planKey: PlanKey,
  billingPeriodKey: BillingPeriodKey,
): number {
  const plan = PLAN_CATALOG[planKey];
  const period = BILLING_PERIODS[billingPeriodKey];
  return plan.monthlyPriceToman * period.monthsPaid;
}

export function calculateAddonOrderAmountToman(
  addonKey: AddonKey,
  billingPeriodKey: BillingPeriodKey,
): number {
  const addon = ADDON_CATALOG[addonKey];
  const period = BILLING_PERIODS[billingPeriodKey];
  return addon.monthlyPriceToman * period.monthsPaid;
}

export function getOrderMonths(
  billingPeriodKey: BillingPeriodKey,
): { monthsPaid: number; monthsGranted: number } {
  const period = BILLING_PERIODS[billingPeriodKey];
  return {
    monthsPaid: period.monthsPaid,
    monthsGranted: period.monthsGranted,
  };
}

export function resolveAiMonthlyLimit(
  planKey: PlanKey | string,
  hasTurbo: boolean,
  turboExpiresAt: Date | null,
): number | null {
  const normalized = normalizePlanKey(planKey);
  const plan = PLAN_CATALOG[normalized];
  const turboActive =
    hasTurbo &&
    turboExpiresAt !== null &&
    turboExpiresAt > new Date() &&
    isPaidPlan(normalized);

  if (turboActive) {
    return null;
  }

  return plan.aiMonthlyLimit;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
