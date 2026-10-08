import type { PlanKey } from '@jalase/shared';

export interface MeetingItem {
  id: string;
  title: string;
  time: string;
  attendeeCount: number;
  day: number;
  month: string;
  meetingDateIso: string;
  isUpcoming: boolean;
  scheduleLabel?: string;
}

export type SubscriptionTier = PlanKey;

export function getSubscriptionTierLabel(tier: SubscriptionTier | string): string {
  const labels: Record<string, string> = {
    free: 'رایگان',
    plus: 'پلاس',
    pro: 'پرو',
    personal: 'پلاس',
    team: 'پرو',
  };
  return labels[tier] ?? 'رایگان';
}
