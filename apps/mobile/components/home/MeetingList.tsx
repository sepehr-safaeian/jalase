import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import type Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { SwipeableMeetingCard } from './SwipeableMeetingCard';
import { MeetingsEmptyState } from './MeetingsEmptyState';
import type { MeetingItem } from './types';

interface MeetingListProps {
  meetings: MeetingItem[];
  title?: string;
  variant?: 'recent' | 'upcoming';
  onMeetingPress?: (meeting: MeetingItem) => void;
  onMeetingDelete?: (meeting: MeetingItem) => void;
  onCreateMeeting?: () => void;
  showEmptyState?: boolean;
  hideSectionTitle?: boolean;
}

export function MeetingList({
  meetings,
  title,
  variant = 'recent',
  onMeetingPress,
  onMeetingDelete,
  onCreateMeeting,
  showEmptyState = true,
  hideSectionTitle = false,
}: MeetingListProps) {
  const { t } = useTranslation();
  const { isRtl } = useSettings();
  const openSwipeRef = useRef<Swipeable | null>(null);
  const sectionTitle = title ?? t('home.recentMeetings');

  const handleSwipeOpen = (ref: Swipeable | null) => {
    if (openSwipeRef.current && openSwipeRef.current !== ref) {
      openSwipeRef.current.close();
    }
    openSwipeRef.current = ref;
  };

  if (meetings.length === 0) {
    if (!showEmptyState) return null;
    return <MeetingsEmptyState onCreatePress={onCreateMeeting} />;
  }

  return (
    <View style={styles.wrapper}>
      {!hideSectionTitle ? (
        <Text
          variant="ui"
          weight="600"
          color="secondary"
          style={{ textAlign: isRtl ? 'right' : 'left' }}
        >
          {sectionTitle}
        </Text>
      ) : null}

      <View style={styles.list}>
        {meetings.map((meeting, index) => (
          <Animated.View
            key={meeting.id}
            entering={FadeInDown.delay(index * 55).duration(280)}
            exiting={FadeOut.duration(360)}
            layout={LinearTransition.duration(360)}
          >
            <SwipeableMeetingCard
              meeting={meeting}
              variant={variant}
              onPress={onMeetingPress}
              onDelete={onMeetingDelete}
              onSwipeOpen={handleSwipeOpen}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.base,
  },
  list: {
    gap: spacing.sm,
  },
});
