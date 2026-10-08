import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { PlanDefinition, PlanKey } from '@jalase/shared';
import { formatToman } from '@/lib/api/subscriptions.api';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radius, spacing } from '@/theme/tokens';

interface PlanCardProps {
  plan: PlanDefinition;
  selected: boolean;
  isCurrent: boolean;
  onSelect: (planKey: PlanKey) => void;
}

const RECOMMENDED_PLAN: PlanKey = 'plus';

export function PlanCard({ plan, selected, isCurrent, onSelect }: PlanCardProps) {
  const { colors } = useTheme();
  const isRecommended = plan.key === RECOMMENDED_PLAN && !isCurrent;

  return (
    <Pressable
      onPress={() => onSelect(plan.key)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.primaryMid : colors.border,
          opacity: pressed ? 0.92 : 1,
        },
        isRecommended && !selected ? styles.recommendedCard : null,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text variant="headingSm" weight="700">
            {plan.name}
          </Text>
          <View style={styles.badges}>
            {isRecommended ? (
              <View style={[styles.recommendedBadge, { backgroundColor: palette.yellow }]}>
                <Text variant="uiSm" weight="700" style={styles.recommendedText}>
                  پیشنهادی
                </Text>
              </View>
            ) : null}
            {isCurrent ? (
              <View style={[styles.currentBadge, { backgroundColor: colors.primaryTint }]}>
                <Text variant="uiSm" weight="600" style={{ color: colors.primary }}>
                  فعال
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text variant="body" color="secondary" style={styles.tagline}>
          {plan.tagline}
        </Text>
      </View>

      <Text variant="headingMd" weight="700" style={styles.price}>
        {plan.monthlyPriceToman === 0
          ? 'رایگان'
          : `${formatToman(plan.monthlyPriceToman)} / ماه`}
      </Text>

      {plan.aiMonthlyLimit !== null && plan.aiMonthlyLimit > 0 ? (
        <View style={[styles.aiPill, { backgroundColor: colors.primaryTint }]}>
          <Feather name="cpu" size={14} color={colors.primaryMid} />
          <Text variant="uiSm" weight="600" style={{ color: colors.primary }}>
            {plan.aiMonthlyLimit} بار هوش مصنوعی در ماه
          </Text>
        </View>
      ) : plan.key === 'free' ? (
        <View style={[styles.aiPill, { backgroundColor: colors.surfaceSoft }]}>
          <Feather name="slash" size={14} color={colors.textMuted} />
          <Text variant="uiSm" color="muted">
            بدون هوش مصنوعی
          </Text>
        </View>
      ) : null}

      <View style={styles.features}>
        {plan.features.map((feature) => (
          <View key={feature.key} style={styles.featureRow}>
            <Feather
              name={feature.included ? 'check' : 'x'}
              size={16}
              color={feature.included ? colors.primaryMid : colors.textMuted}
            />
            <Text
              variant="ui"
              color={feature.included ? 'primary' : 'muted'}
              style={styles.featureText}
            >
              {feature.label}
            </Text>
          </View>
        ))}
      </View>

      {plan.meetingIntegrations.length > 0 ? (
        <View style={[styles.integrations, { backgroundColor: colors.surfaceSoft }]}>
          <Text variant="uiSm" color="muted" style={styles.integrationsLabel}>
            اتصال جلسه آنلاین
          </Text>
          <Text variant="uiSm" color="secondary" style={styles.integrationsList}>
            {plan.meetingIntegrations.join('، ')}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.cardPadding,
    gap: spacing.lg,
  },
  recommendedCard: {
    borderWidth: 1.5,
  },
  header: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recommendedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  recommendedText: {
    color: palette.ink,
  },
  currentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  tagline: {
    textAlign: 'right',
    lineHeight: 22,
  },
  price: {
    textAlign: 'right',
  },
  aiPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  features: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureText: {
    flex: 1,
    textAlign: 'right',
    lineHeight: 22,
  },
  integrations: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  integrationsLabel: {
    textAlign: 'right',
  },
  integrationsList: {
    textAlign: 'right',
    lineHeight: 20,
  },
});
