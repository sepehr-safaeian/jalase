import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const PHASE_KEYS = [
  { key: 'before', label: 'home.phaseBefore', text: 'home.phaseBeforeText' },
  { key: 'during', label: 'home.phaseDuring', text: 'home.phaseDuringText' },
  { key: 'after', label: 'home.phaseAfter', text: 'home.phaseAfterText' },
] as const;

interface MeetingsEmptyStateProps {
  onCreatePress?: () => void;
}

export function MeetingsEmptyState({ onCreatePress }: MeetingsEmptyStateProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const align = isRtl ? 'right' : 'left';
  const contentAlign = isRtl ? 'flex-end' : 'flex-start';
  const rowDir = isRtl ? 'row-reverse' : 'row';

  return (
    <Animated.View entering={FadeIn.duration(320)} style={styles.wrapper}>
      <Animated.View
        entering={FadeInDown.duration(320)}
        style={[styles.header, { alignItems: contentAlign }]}
      >
        <Text
          variant="headingMd"
          weight="700"
          style={[styles.title, { textAlign: align }]}
        >
          {t('home.emptyTitle')}
        </Text>
        <Text
          variant="body"
          color="secondary"
          style={[styles.subtitle, { textAlign: align }]}
        >
          {t('home.emptyBody')}
        </Text>
      </Animated.View>

      <View
        style={[
          styles.timelineCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {PHASE_KEYS.map((phase, index) => (
          <Animated.View
            key={phase.key}
            entering={FadeInDown.delay(80 + index * 55).duration(280)}
            style={[styles.phaseRow, { flexDirection: rowDir }]}
          >
            <View style={styles.phaseRail}>
              <View
                style={[
                  styles.phaseDot,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primaryMid,
                  },
                ]}
              />
              {index < PHASE_KEYS.length - 1 ? (
                <View
                  style={[styles.phaseLine, { backgroundColor: colors.border }]}
                />
              ) : null}
            </View>

            <View style={[styles.phaseContent, { alignItems: contentAlign }]}>
              <View style={styles.labelRow}>
                <View
                  style={[
                    styles.highlight,
                    { backgroundColor: colors.highlight },
                  ]}
                />
                <Text
                  variant="ui"
                  weight="700"
                  style={{ textAlign: align }}
                >
                  {t(phase.label)}
                </Text>
              </View>
              <Text
                variant="uiSm"
                color="muted"
                style={[styles.phaseText, { textAlign: align }]}
              >
                {t(phase.text)}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(240).duration(280)}>
        <Text
          variant="ui"
          color="muted"
          style={[styles.footer, { textAlign: align }]}
        >
          {t('home.emptyFooter')}
        </Text>
      </Animated.View>

      {onCreatePress ? (
        <Animated.View entering={FadeInDown.delay(260).duration(280)}>
          <Pressable
            onPress={onCreatePress}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderStrong,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('home.createFirstMeeting')}
          >
            <Text variant="body" weight="600">
              {t('home.createFirstMeeting')}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: spacing['2xl'],
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    lineHeight: 36,
  },
  subtitle: {
    lineHeight: 26,
    maxWidth: 340,
  },
  timelineCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    gap: spacing.base,
  },
  phaseRow: {
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  phaseRail: {
    width: 16,
    alignItems: 'center',
    paddingTop: 5,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  phaseLine: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    marginTop: spacing.xs,
  },
  phaseContent: {
    flex: 1,
    gap: spacing.xs,
  },
  labelRow: {
    position: 'relative',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 1,
    height: 8,
    opacity: 0.45,
    borderRadius: radius.sm,
  },
  phaseText: {
    lineHeight: 22,
  },
  footer: {
    lineHeight: 22,
  },
  cta: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
    justifyContent: 'center',
  },
});
