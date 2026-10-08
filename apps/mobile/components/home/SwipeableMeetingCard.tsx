import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { MeetingCard } from './MeetingCard';
import type { MeetingItem } from './types';

const DELETE_ACTION_WIDTH = 88;
const DELETE_OPEN_THRESHOLD = 40;

interface SwipeableMeetingCardProps {
  meeting: MeetingItem;
  variant?: 'recent' | 'upcoming';
  onPress?: (meeting: MeetingItem) => void;
  onDelete?: (meeting: MeetingItem) => void;
  onSwipeOpen?: (ref: Swipeable | null) => void;
}

export function SwipeableMeetingCard({
  meeting,
  variant = 'recent',
  onPress,
  onDelete,
  onSwipeOpen,
}: SwipeableMeetingCardProps) {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  const swipeRef = useRef<Swipeable>(null);
  const isDeletingRef = useRef(false);
  const blockPressRef = useRef(false);

  const deleteTint =
    scheme === 'dark' ? 'rgba(249, 112, 102, 0.14)' : 'rgba(180, 35, 24, 0.07)';

  const triggerDelete = useCallback(() => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    blockPressRef.current = true;
    onDelete?.(meeting);
  }, [meeting, onDelete]);

  const renderDeleteAction = useCallback(() => {
    return (
      <Pressable
        onPress={triggerDelete}
        style={({ pressed }) => [
          styles.deleteZone,
          {
            backgroundColor: deleteTint,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Text variant="ui" weight="700" style={{ color: colors.error }}>
          {t('common.delete')}
        </Text>
      </Pressable>
    );
  }, [colors.error, deleteTint, t, triggerDelete]);

  const handlePress = useCallback(() => {
    if (blockPressRef.current || isDeletingRef.current) return;
    onPress?.(meeting);
  }, [meeting, onPress]);

  const handleSwipeStart = useCallback(() => {
    blockPressRef.current = true;
  }, []);

  const handleSwipeableWillOpen = useCallback(() => {
    onSwipeOpen?.(swipeRef.current);
    triggerDelete();
  }, [onSwipeOpen, triggerDelete]);

  const handleSwipeableClose = useCallback(() => {
    if (isDeletingRef.current) return;
    setTimeout(() => {
      blockPressRef.current = false;
    }, 320);
  }, []);

  return (
    <View style={styles.shell}>
      <Swipeable
        ref={swipeRef}
        friction={2}
        overshootLeft={false}
        overshootRight={false}
        leftThreshold={DELETE_OPEN_THRESHOLD}
        rightThreshold={DELETE_OPEN_THRESHOLD}
        renderLeftActions={renderDeleteAction}
        renderRightActions={renderDeleteAction}
        onSwipeableOpenStartDrag={handleSwipeStart}
        onSwipeableWillOpen={handleSwipeableWillOpen}
        onSwipeableClose={handleSwipeableClose}
      >
        <MeetingCard meeting={meeting} variant={variant} onPress={handlePress} />
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  deleteZone: {
    width: DELETE_ACTION_WIDTH,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
