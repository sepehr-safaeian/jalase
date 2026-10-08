import type { Tier } from '../types/tier.js';

export type PlanKey = 'free' | 'plus' | 'pro';

export type AddonKey = 'turbo';

export type BillingPeriodKey = '3m' | '6m' | '1y';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'cancelled'
  | 'failed';

export type OrderType = 'plan' | 'addon';

export type WorkspaceMemberRole = 'owner' | 'admin' | 'member';

export interface PlanFeature {
  key: string;
  label: string;
  included: boolean;
}

export interface PlanDefinition {
  key: PlanKey;
  tier: Tier;
  name: string;
  tagline: string;
  monthlyPriceToman: number;
  aiMonthlyLimit: number | null;
  features: PlanFeature[];
  meetingIntegrations: string[];
}

export interface AddonDefinition {
  key: AddonKey;
  name: string;
  tagline: string;
  monthlyPriceToman: number;
  features: PlanFeature[];
  requiresPaidPlan: boolean;
}

export interface BillingPeriodDefinition {
  key: BillingPeriodKey;
  label: string;
  monthsPaid: number;
  monthsGranted: number;
  badge?: string;
}

export interface SubscriptionSummary {
  planKey: PlanKey;
  tier: Tier;
  status: SubscriptionStatus;
  expiresAt: string | null;
  aiUsageCount: number;
  aiMonthlyLimit: number | null;
  billingPeriodKey: BillingPeriodKey | null;
  hasTurbo: boolean;
  turboExpiresAt: string | null;
}

export interface OrderSummary {
  id: string;
  orderType: OrderType;
  planKey: PlanKey | null;
  addonKey: AddonKey | null;
  billingPeriodKey: BillingPeriodKey;
  status: OrderStatus;
  amountToman: number;
  monthsPaid: number;
  monthsGranted: number;
  createdAt: string;
  paidAt: string | null;
}

export interface CreateOrderRequest {
  planKey: PlanKey;
  billingPeriodKey: BillingPeriodKey;
}

export interface CreateAddonOrderRequest {
  addonKey: AddonKey;
  billingPeriodKey: BillingPeriodKey;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: WorkspaceMemberRole;
  memberCount: number;
}

export interface WorkspaceMemberSummary {
  id: string;
  userId: string | null;
  email: string;
  displayName: string | null;
  role: WorkspaceMemberRole;
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface AddWorkspaceMemberRequest {
  email: string;
  role?: WorkspaceMemberRole;
}

export interface InitPaymentRequest {
  returnUrl?: string;
}

export interface InitPaymentResponse {
  paymentUrl: string | null;
  trackId: string;
  orderId: string;
  amountToman: number;
  alreadyPaid: boolean;
}
