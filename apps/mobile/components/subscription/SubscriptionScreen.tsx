import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import {
  ADDON_CATALOG,
  BILLING_PERIODS,
  calculateAddonOrderAmountToman,
  calculateOrderAmountToman,
  type AddonDefinition,
  type BillingPeriodKey,
  type PlanDefinition,
  type PlanKey,
} from '@jalase/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { SegmentedControl } from '@/components/settings/SegmentedControl';
import { PlanCard } from '@/components/subscription/PlanCard';
import { TurboCard } from '@/components/subscription/TurboCard';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  createAddonOrder,
  createOrder,
  formatToman,
  getPaymentReturnUrl,
  getPlanLabel,
  getPlansCatalog,
  initOrderPayment,
  isPaidPlanKey,
  openPaymentUrl,
  switchToFreePlan,
} from '@/lib/api/subscriptions.api';
import { getCalendarIntlLocale } from '@/lib/format-date';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type PurchaseMode = 'plan' | 'turbo';

const FALLBACK_TURBO_ADDON: AddonDefinition = ADDON_CATALOG?.turbo ?? {
  key: 'turbo',
  name: 'توربو',
  tagline: 'هوش مصنوعی نامحدود برای جلسات پرتعداد',
  monthlyPriceToman: 299_000,
  requiresPaidPlan: true,
  features: [
    { key: 'ai_unlimited', label: 'استفاده نامحدود از هوش مصنوعی', included: true },
    { key: 'requires_paid', label: 'نیاز به اشتراک فعال پلاس یا پرو', included: true },
  ],
};

export function SubscriptionScreen() {
  const { user, refreshUser } = useAuth();
  const { isLoading, isAuthenticated } = useRequireAuth({ requireProfile: true });
  const { colors } = useTheme();

  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [addons, setAddons] = useState<AddonDefinition[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('plus');
  const [turboSelected, setTurboSelected] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('plan');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriodKey>('3m');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingLabel, setPendingLabel] = useState('');

  const currentPlan = user?.subscription?.planKey ?? 'free';
  const hasTurbo = user?.subscription?.hasTurbo ?? false;
  const canBuyTurbo = isPaidPlanKey(currentPlan);

  const loadCatalog = useCallback(async () => {
    try {
      const catalog = await getPlansCatalog();
      setPlans(catalog.plans ?? []);
      setAddons(catalog.addons ?? []);
    } catch {
      setError('بارگذاری پلن‌ها ناموفق بود');
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const turboAddon = useMemo(
    () =>
      addons.find((addon) => addon.key === 'turbo') ?? FALLBACK_TURBO_ADDON,
    [addons],
  );

  const selectedPlanDef = useMemo(
    () => plans.find((plan) => plan.key === selectedPlan),
    [plans, selectedPlan],
  );

  const orderTotal = useMemo(() => {
    if (purchaseMode === 'turbo') {
      return calculateAddonOrderAmountToman('turbo', billingPeriod);
    }
    if (!selectedPlanDef || selectedPlan === 'free') {
      return 0;
    }
    return calculateOrderAmountToman(selectedPlan, billingPeriod);
  }, [purchaseMode, selectedPlan, selectedPlanDef, billingPeriod]);

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  function handleSelectPlan(planKey: PlanKey) {
    setPurchaseMode('plan');
    setTurboSelected(false);
    setSelectedPlan(planKey);
  }

  function handleSelectTurbo() {
    if (!canBuyTurbo) {
      return;
    }
    setPurchaseMode('turbo');
    setTurboSelected(true);
  }

  async function handleActivate() {
    setError(null);
    setLoading(true);

    try {
      if (purchaseMode === 'turbo') {
        const order = await createAddonOrder({
          addonKey: 'turbo',
          billingPeriodKey: billingPeriod,
        });
        setPendingOrderId(order.id);
        setPendingAmount(order.amountToman);
        setPendingLabel('پکیج توربو');
        return;
      }

      if (selectedPlan === 'free') {
        await switchToFreePlan();
        await refreshUser();
        return;
      }

      const order = await createOrder({
        planKey: selectedPlan,
        billingPeriodKey: billingPeriod,
      });
      setPendingOrderId(order.id);
      setPendingAmount(order.amountToman);
      setPendingLabel(getPlanLabel(selectedPlan));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ایجاد سفارش ناموفق بود');
      setPendingOrderId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleProceedToGateway() {
    if (!pendingOrderId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payment = await initOrderPayment(pendingOrderId, {
        returnUrl: getPaymentReturnUrl(),
      });

      if (payment.alreadyPaid) {
        setPendingOrderId(null);
        setTurboSelected(false);
        setPurchaseMode('plan');
        await refreshUser();
        return;
      }

      if (!payment.paymentUrl) {
        throw new Error('آدرس درگاه پرداخت دریافت نشد');
      }

      setPendingOrderId(null);
      await openPaymentUrl(payment.paymentUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'شروع پرداخت ناموفق بود');
    } finally {
      setLoading(false);
    }
  }

  function handleClosePaymentModal() {
    if (!loading) {
      setPendingOrderId(null);
    }
  }

  const period = BILLING_PERIODS[billingPeriod];
  const showBilling = purchaseMode === 'turbo' || selectedPlan !== 'free';
  const ctaLabel =
    purchaseMode === 'turbo'
      ? `خرید توربو ${formatToman(orderTotal)}`
      : selectedPlan === 'free'
        ? currentPlan === 'free'
          ? 'پلن رایگان فعال است'
          : 'بازگشت به پلن رایگان'
        : `ادامه و پرداخت ${formatToman(orderTotal)}`;

  return (
    <Screen scroll>
      <AppHeader title="اشتراک" />

      <Card style={styles.currentCard}>
        <Text variant="uiSm" color="muted" style={styles.currentLabel}>
          پلن فعلی شما
        </Text>
        <Text variant="headingSm" weight="700" style={styles.currentValue}>
          {getPlanLabel(currentPlan)}
          {hasTurbo ? ' + توربو' : ''}
        </Text>
        {user.subscription?.expiresAt ? (
          <Text variant="uiSm" color="secondary" style={styles.currentExpiry}>
            اعتبار تا{' '}
            {new Intl.DateTimeFormat(getCalendarIntlLocale(), {
              dateStyle: 'medium',
            }).format(new Date(user.subscription.expiresAt))}
          </Text>
        ) : null}
        {hasTurbo && user.subscription?.turboExpiresAt ? (
          <Text variant="uiSm" color="secondary" style={styles.currentExpiry}>
            توربو تا{' '}
            {new Intl.DateTimeFormat(getCalendarIntlLocale(), {
              dateStyle: 'medium',
            }).format(new Date(user.subscription.turboExpiresAt))}
          </Text>
        ) : null}
      </Card>

      <Text variant="headingSm" weight="700" style={styles.sectionTitle}>
        پلن‌ها
      </Text>

      <View style={styles.plans}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            selected={purchaseMode === 'plan' && selectedPlan === plan.key}
            isCurrent={currentPlan === plan.key}
            onSelect={handleSelectPlan}
          />
        ))}
      </View>

      <Text variant="headingSm" weight="700" style={styles.sectionTitle}>
        پکیج توربو
      </Text>
      <Text variant="body" color="secondary" style={styles.sectionHint}>
        هوش مصنوعی نامحدود. فقط با اشتراک فعال پلاس یا پرو.
      </Text>

      <View style={styles.turboSection}>
        <TurboCard
          addon={turboAddon}
          selected={turboSelected}
          isActive={hasTurbo}
          disabled={!canBuyTurbo}
          onSelect={handleSelectTurbo}
        />
      </View>

      {showBilling ? (
        <Card style={styles.billingCard}>
          <SegmentedControl
            label="دوره پرداخت"
            hint="اشتراک ماهانه، پرداخت دوره‌ای"
            value={billingPeriod}
            options={[
              { value: '3m', label: '3 ماهه' },
              { value: '6m', label: '6 ماهه' },
              { value: '1y', label: 'یک‌ساله' },
            ]}
            onChange={setBillingPeriod}
          />

          <View style={[styles.summary, { borderTopColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text variant="body" color="secondary">
                {purchaseMode === 'turbo' ? 'پکیج' : 'پلن'}
              </Text>
              <Text variant="body" weight="600">
                {purchaseMode === 'turbo' ? 'توربو' : getPlanLabel(selectedPlan)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="body" color="secondary">
                مدت اعتبار
              </Text>
              <Text variant="body" weight="600">
                {period.monthsGranted} ماه
                {period.badge ? ` (${period.badge})` : ''}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="body" color="secondary">
                مبلغ قابل پرداخت
              </Text>
              <Text variant="headingSm" weight="700" style={{ color: colors.primary }}>
                {formatToman(orderTotal)}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {error ? (
        <Text variant="uiSm" color="error" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Button
        label={ctaLabel}
        loading={loading}
        disabled={
          (purchaseMode === 'plan' && selectedPlan === 'free' && currentPlan === 'free') ||
          (purchaseMode === 'turbo' && (!canBuyTurbo || hasTurbo))
        }
        onPress={() => void handleActivate()}
        style={styles.cta}
      />

      <Text variant="uiSm" color="quiet" style={styles.note}>
        نسخه سازمانی با امکانات پیشرفته پس از MVP عرضه می‌شود.
      </Text>

      <Modal
        visible={Boolean(pendingOrderId)}
        transparent
        animationType="fade"
        onRequestClose={handleClosePaymentModal}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text variant="headingSm" weight="700" style={styles.modalTitle}>
              پرداخت اشتراک
            </Text>
            <Text variant="body" color="secondary" style={styles.modalBody}>
              {pendingLabel
                ? `فعال‌سازی ${pendingLabel}. پرداخت از طریق درگاه امن زیبال انجام می‌شود.`
                : 'پرداخت از طریق درگاه امن زیبال انجام می‌شود.'}
            </Text>
            <Text variant="headingMd" weight="700" style={styles.modalAmount}>
              {formatToman(pendingAmount)}
            </Text>
            <Text variant="uiSm" color="quiet" style={styles.modalTrust}>
              پرداخت امن با زیبال
            </Text>
            <View style={styles.modalActions}>
              <Button
                label="انصراف"
                variant="secondary"
                onPress={handleClosePaymentModal}
                disabled={loading}
                style={styles.modalButton}
              />
              <Button
                label="ادامه به درگاه پرداخت"
                loading={loading}
                onPress={() => void handleProceedToGateway()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  currentCard: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  currentLabel: {
    textAlign: 'right',
  },
  currentValue: {
    textAlign: 'right',
  },
  currentExpiry: {
    textAlign: 'right',
  },
  sectionTitle: {
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  sectionHint: {
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  plans: {
    gap: spacing.lg,
    marginBottom: spacing.section,
  },
  turboSection: {
    marginBottom: spacing.xl,
  },
  billingCard: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  summary: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.lg,
    gap: spacing.md,
    marginHorizontal: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  error: {
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  cta: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  note: {
    textAlign: 'right',
    lineHeight: 20,
    paddingBottom: spacing.section,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 15, 12, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.cardPadding,
    gap: spacing.lg,
  },
  modalTitle: {
    textAlign: 'right',
  },
  modalBody: {
    textAlign: 'right',
    lineHeight: 24,
  },
  modalAmount: {
    textAlign: 'center',
  },
  modalTrust: {
    textAlign: 'center',
  },
  modalActions: {
    gap: spacing.sm,
  },
  modalButton: {
    width: '100%',
  },
});
