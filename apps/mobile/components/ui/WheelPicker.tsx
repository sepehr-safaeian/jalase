import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
export const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const WEB_SCROLL_SETTLE_MS = 120;

interface WheelPickerProps<T extends string | number> {
  items: readonly T[];
  value: T;
  onValueChange: (value: T) => void;
  formatLabel: (value: T) => string;
  style?: ViewStyle;
  testID?: string;
}

export function WheelPicker<T extends string | number>({
  items,
  value,
  onValueChange,
  formatLabel,
  style,
  testID,
}: WheelPickerProps<T>) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const isUserScroll = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollEventRef = useRef<NativeSyntheticEvent<NativeScrollEvent> | null>(
    null,
  );
  const [focusedIndex, setFocusedIndex] = useState(() =>
    Math.max(0, items.indexOf(value)),
  );

  const selectedIndex = Math.max(0, items.indexOf(value));

  const scrollToIndex = useCallback((index: number, animated = false) => {
    scrollRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated,
    });
    setFocusedIndex(index);
  }, []);

  const commitIndex = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), items.length - 1);
      scrollToIndex(clamped, true);
      const nextValue = items[clamped];
      if (nextValue !== undefined && nextValue !== value) {
        onValueChange(nextValue);
      }
    },
    [items, onValueChange, scrollToIndex, value],
  );

  const handleScrollSettle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isUserScroll.current = false;
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      setFocusedIndex(index);
      commitIndex(index);
    },
    [commitIndex],
  );

  const scheduleScrollSettle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      lastScrollEventRef.current = event;
      const offsetY = event.nativeEvent.contentOffset.y;
      setFocusedIndex(Math.round(offsetY / ITEM_HEIGHT));

      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
      settleTimerRef.current = setTimeout(() => {
        if (lastScrollEventRef.current) {
          handleScrollSettle(lastScrollEventRef.current);
        }
      }, WEB_SCROLL_SETTLE_MS);
    },
    [handleScrollSettle],
  );

  useEffect(() => {
    if (!isUserScroll.current) {
      scrollToIndex(selectedIndex, false);
    }
  }, [selectedIndex, scrollToIndex]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const handleItemPress = useCallback(
    (index: number) => {
      isUserScroll.current = true;
      commitIndex(index);
      setTimeout(() => {
        isUserScroll.current = false;
      }, 180);
    },
    [commitIndex],
  );

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View
        pointerEvents="none"
        style={[
          styles.selectionFrame,
          {
            borderTopColor: colors.borderStrong,
            borderBottomColor: colors.borderStrong,
          },
        ]}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        nestedScrollEnabled
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          isUserScroll.current = true;
        }}
        onScroll={Platform.OS === 'web' ? scheduleScrollSettle : undefined}
        onMomentumScrollEnd={handleScrollSettle}
        onScrollEndDrag={(event) => {
          if (Platform.OS === 'web') {
            scheduleScrollSettle(event);
            return;
          }
          const velocityY = event.nativeEvent.velocity?.y ?? 0;
          if (Math.abs(velocityY) < 0.01) {
            handleScrollSettle(event);
          }
        }}
        contentContainerStyle={styles.scrollContent}
        style={[
          styles.scrollView,
          Platform.OS === 'web' ? styles.scrollViewWeb : null,
        ]}
      >
        {items.map((item, index) => {
          const isFocused = index === focusedIndex;
          return (
            <Pressable
              key={String(item)}
              onPress={() => handleItemPress(index)}
              style={({ pressed }) => [
                styles.item,
                Platform.OS === 'web' && pressed ? styles.itemPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
            >
              <Text
                variant="body"
                weight={isFocused ? '700' : '500'}
                color={isFocused ? 'inherit' : 'muted'}
                style={styles.label}
                numberOfLines={1}
              >
                {formatLabel(item)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  scrollView: {
    height: PICKER_HEIGHT,
    width: '100%',
    zIndex: 1,
  },
  scrollViewWeb: {
    overflowY: 'scroll',
    overscrollBehavior: 'contain',
    touchAction: 'pan-y',
    cursor: 'ns-resize',
    scrollbarWidth: 'none',
  } as ViewStyle,
  selectionFrame: {
    position: 'absolute',
    left: spacing.xs,
    right: spacing.xs,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 0,
  },
  scrollContent: {
    paddingVertical: ITEM_HEIGHT * 2,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  itemPressed: {
    opacity: 0.72,
  },
  label: {
    textAlign: 'center',
  },
});

export { ITEM_HEIGHT as WHEEL_ITEM_HEIGHT };
