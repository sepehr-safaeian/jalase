import { useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { MeetingBucket } from '@jalase/shared';
import { Text } from '@/components/ui/Text';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const TAB_ORDER: MeetingBucket[] = ['today', 'tomorrow', 'next_week', 'past'];

const TAB_LABEL_KEYS: Record<MeetingBucket, string> = {
  today: 'common.today',
  tomorrow: 'common.tomorrow',
  next_week: 'common.nextWeek',
  past: 'common.past',
};

interface MeetingTabsProps {
  active: MeetingBucket;
  onChange: (bucket: MeetingBucket) => void;
  counts?: Partial<Record<MeetingBucket, number>>;
}

export function MeetingTabs({ active, onChange, counts }: MeetingTabsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const scrollRef = useRef<ScrollView>(null);
  const layoutsRef = useRef<Partial<Record<MeetingBucket, { x: number; width: number }>>>({});
  const [trackWidth, setTrackWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);

  const moveIndicator = (bucket: MeetingBucket) => {
    const layout = layoutsRef.current[bucket];
    if (!layout) return;
    indicatorX.value = withTiming(layout.x, { duration: 180 });
    indicatorW.value = withTiming(layout.width, { duration: 180 });
  };

  useEffect(() => {
    moveIndicator(active);
    const index = TAB_ORDER.indexOf(active);
    if (index > 1) {
      scrollRef.current?.scrollTo({ x: index * 72, animated: true });
    }
  }, [active, trackWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  const onTabLayout = (bucket: MeetingBucket) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    layoutsRef.current[bucket] = { x, width };
    if (bucket === active) {
      indicatorX.value = x;
      indicatorW.value = width;
    }
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        style={styles.scroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.row,
          {
            flexDirection: isRtl ? 'row-reverse' : 'row',
          },
          trackWidth > 0 ? { width: trackWidth } : null,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {TAB_ORDER.map((bucket) => {
          const selected = bucket === active;
          const count = counts?.[bucket];

          return (
            <Pressable
              key={bucket}
              onLayout={onTabLayout(bucket)}
              onPress={() => onChange(bucket)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.tab,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Text
                variant="uiSm"
                weight={selected ? '700' : '500'}
                style={{
                  color: selected ? colors.primary : colors.textSecondary,
                }}
              >
                {t(TAB_LABEL_KEYS[bucket])}
              </Text>
              {count && count > 0 ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: selected ? colors.primaryTint : colors.surfaceSoft,
                    },
                  ]}
                >
                  <Text
                    variant="uiSm"
                    weight="600"
                    style={{
                      color: selected ? colors.primary : colors.textMuted,
                      fontSize: 11,
                    }}
                  >
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: colors.primary },
          indicatorStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  scroll: {
    width: '100%',
  },
  row: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  tab: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: radius.pill,
  },
});
