import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { MeetingBucket } from '@jalase/shared';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const COPY_KEYS: Record<MeetingBucket, { title: string; subtitle: string }> = {
  today: {
    title: 'home.emptyTodayTitle',
    subtitle: 'home.emptyTodayBody',
  },
  tomorrow: {
    title: 'home.emptyTomorrowTitle',
    subtitle: 'home.emptyTomorrowBody',
  },
  next_week: {
    title: 'home.emptyNextWeekTitle',
    subtitle: 'home.emptyNextWeekBody',
  },
  past: {
    title: 'home.emptyPastTitle',
    subtitle: 'home.emptyPastBody',
  },
};

interface MeetingTabEmptyStateProps {
  bucket: MeetingBucket;
}

export function MeetingTabEmptyState({ bucket }: MeetingTabEmptyStateProps) {
  const { t } = useTranslation();
  const { isRtl } = useSettings();
  const copy = COPY_KEYS[bucket];
  const align = isRtl ? 'right' : 'left';

  return (
    <Animated.View
      entering={FadeIn.duration(240)}
      style={[styles.wrap, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}
    >
      <Text
        variant="headingSm"
        weight="600"
        style={{ textAlign: align }}
      >
        {t(copy.title)}
      </Text>
      <Text
        variant="body"
        color="muted"
        style={[styles.subtitle, { textAlign: align }]}
      >
        {t(copy.subtitle)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  subtitle: {
    lineHeight: 24,
    maxWidth: 320,
  },
});
