import type {
  AddonDefinition,
  BillingPeriodDefinition,
  BillingPeriodKey,
  CreateAddonOrderRequest,
  CreateOrderRequest,
  InitPaymentRequest,
  InitPaymentResponse,
  OrderSummary,
  PlanDefinition,
  PlanKey,
  SubscriptionSummary,
} from '@jalase/shared';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { apiRequest } from './client';
import { getAccessToken } from '@/lib/auth/token-storage';

async function token() {
  const value = await getAccessToken();
  if (!value) {
    throw new Error('نشست منقضی شده است');
  }
  return value;
}

export interface PlansCatalogResponse {
  plans: PlanDefinition[];
  addons: AddonDefinition[];
  billingPeriods: BillingPeriodDefinition[];
}

export function getPlansCatalog(): Promise<PlansCatalogResponse> {
  return apiRequest<PlansCatalogResponse>('/subscriptions/plans');
}

export function getMySubscription(): Promise<SubscriptionSummary> {
  return token().then((t) =>
    apiRequest<SubscriptionSummary>('/subscriptions/me', { token: t }),
  );
}

export function createOrder(
  payload: CreateOrderRequest,
): Promise<OrderSummary> {
  return token().then((t) =>
    apiRequest<OrderSummary>('/subscriptions/orders', {
      method: 'POST',
      token: t,
      body: payload,
    }),
  );
}

export function createAddonOrder(
  payload: CreateAddonOrderRequest,
): Promise<OrderSummary> {
  return token().then((t) =>
    apiRequest<OrderSummary>('/subscriptions/addon-orders', {
      method: 'POST',
      token: t,
      body: payload,
    }),
  );
}

export function confirmOrderPayment(orderId: string): Promise<{
  order: OrderSummary;
  subscription: SubscriptionSummary;
}> {
  return token().then((t) =>
    apiRequest<{ order: OrderSummary; subscription: SubscriptionSummary }>(
      `/subscriptions/orders/${orderId}/pay`,
      { method: 'POST', token: t },
    ),
  );
}

export function initOrderPayment(
  orderId: string,
  payload?: InitPaymentRequest,
): Promise<InitPaymentResponse> {
  return token().then((t) =>
    apiRequest<InitPaymentResponse>(
      `/subscriptions/orders/${orderId}/pay/init`,
      { method: 'POST', token: t, body: payload ?? {} },
    ),
  );
}

export function getOrder(orderId: string): Promise<OrderSummary> {
  return token().then((t) =>
    apiRequest<OrderSummary>(`/subscriptions/orders/${orderId}`, { token: t }),
  );
}

export function getPaymentReturnUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/subscription/result`;
  }
  return Linking.createURL('/subscription/result');
}

export async function openPaymentUrl(paymentUrl: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(paymentUrl);
    return;
  }
  await Linking.openURL(paymentUrl);
}

export function switchToFreePlan(): Promise<SubscriptionSummary> {
  return token().then((t) =>
    apiRequest<SubscriptionSummary>('/subscriptions/free', {
      method: 'POST',
      token: t,
    }),
  );
}

export function formatToman(amount: number): string {
  if (amount === 0) {
    return 'رایگان';
  }
  return `${new Intl.NumberFormat('en-US', { useGrouping: true }).format(amount)} تومان`;
}

export function getPlanLabel(planKey: PlanKey | string): string {
  const labels: Record<string, string> = {
    free: 'رایگان',
    plus: 'پلاس',
    pro: 'پرو',
    personal: 'پلاس',
    team: 'پرو',
  };
  return labels[planKey] ?? 'رایگان';
}

export function isPaidPlanKey(planKey: PlanKey | string): boolean {
  return planKey === 'plus' || planKey === 'pro' || planKey === 'personal' || planKey === 'team';
}

export type { BillingPeriodKey };
