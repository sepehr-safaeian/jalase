import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import type { AddonDefinition } from '@jalase/shared';
import { formatToman } from '@/lib/api/subscriptions.api';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radius, spacing } from '@/theme/tokens';

interface TurboCardProps {
  addon: AddonDefinition | null | undefined;
  selected: boolean;
  isActive: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function GradientFrame() {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="turboBorder" x1="0%" y1="50%" x2="100%" y2="50%">
          <Stop offset="0%" stopColor={palette.ink} />
          <Stop offset="35%" stopColor={palette.yellow} />
          <Stop offset="65%" stopColor={palette.pink} />
          <Stop offset="100%" stopColor={palette.purple} />
        </LinearGradient>
      </Defs>
      <Rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx={radius.lg + 2}
        fill="url(#turboBorder)"
      />
    </Svg>
  );
}

export function TurboCard({
  addon,
  selected,
  isActive,
  disabled,
  onSelect,
}: TurboCardProps) {
  const { colors } = useTheme();

  if (!addon) {
    return null;
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onSelect}
      style={({ pressed }) => [
        styles.wrapper,
        {
          opacity: disabled ? 0.55 : pressed ? 0.94 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <View style={styles.gradientShell}>
        <GradientFrame />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: selected ? colors.highlight : 'transparent',
            },
          ]}
        >
          <View style={styles.topRow}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBadge}>
                <Feather name="zap" size={18} color={palette.ink} />
              </View>
              <View style={styles.titleTexts}>
                <Text variant="headingSm" weight="700">
                  {addon.name}
                </Text>
                <Text variant="uiSm" color="secondary" style={styles.tagline}>
                  {addon.tagline}
                </Text>
              </View>
            </View>
            {isActive ? (
              <View style={[styles.activeBadge, { backgroundColor: colors.primaryTint }]}>
                <Text variant="uiSm" weight="600" style={{ color: colors.primary }}>
                  فعال
                </Text>
              </View>
            ) : (
              <View style={styles.unlimitedBadge}>
                <Text variant="uiSm" weight="700" style={styles.unlimitedText}>
                  نامحدود
                </Text>
              </View>
            )}
          </View>

          <Text variant="headingMd" weight="700" style={styles.price}>
            {formatToman(addon.monthlyPriceToman)} / ماه
          </Text>

          <View style={styles.features}>
            {addon.features.map((feature) => (
              <View key={feature.key} style={styles.featureRow}>
                <Feather name="check" size={16} color={colors.primaryMid} />
                <Text variant="ui" color="primary" style={styles.featureText}>
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>

          {disabled ? (
            <View style={[styles.requirement, { backgroundColor: colors.surfaceSoft }]}>
              <Feather name="lock" size={14} color={colors.textMuted} />
              <Text variant="uiSm" color="muted" style={styles.requirementText}>
                ابتدا یکی از پلن‌های پلاس یا پرو را فعال کنید
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg + 2,
  },
  gradientShell: {
    borderRadius: radius.lg + 2,
    padding: 2,
    overflow: 'hidden',
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.cardPadding,
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTexts: {
    flex: 1,
    gap: spacing.xs,
  },
  tagline: {
    textAlign: 'right',
    lineHeight: 20,
  },
  activeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  unlimitedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: palette.yellow,
  },
  unlimitedText: {
    color: palette.ink,
  },
  price: {
    textAlign: 'right',
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
  requirement: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  requirementText: {
    flex: 1,
    textAlign: 'right',
    lineHeight: 20,
  },
});
