import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MeetingBucket, NoteSummary } from '@jalase/shared';
import { getDisplayName } from '@jalase/shared';
import { createNote, deleteNote } from '@/lib/api/notes.api';
import { formatDateParts, formatTime } from '@/lib/format-date';
import { formatUpcomingScheduleLabel } from '@/lib/schedule-date';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useMeetingBucket } from '@/hooks/useMeetingBucket';
import { invalidateMeetingsCache, removeMeetingFromCache } from '@/lib/cache/meetings-cache';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radius, spacing } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';
import { SubtleToast } from '@/components/ui/SubtleToast';
import { HomeHeader } from './HomeHeader';
import { MeetingList } from './MeetingList';
import { MeetingTabs } from './MeetingTabs';
import { MeetingTabEmptyState } from './MeetingTabEmptyState';
import { NewNoteFab } from './NewNoteFab';
import {
  NewMeetingActionSheet,
  type NewMeetingChoice,
} from './NewMeetingActionSheet';
import { ScheduleMeetingSheet } from './ScheduleMeetingSheet';
import type { MeetingItem } from './types';

function mapNoteToMeeting(note: NoteSummary, bucket: MeetingBucket): MeetingItem {
  const dateSource = note.meetingDate ?? note.createdAt;
  const date = new Date(dateSource);
  const day = date.getDate();
  const { month } = formatDateParts(dateSource);
  const isUpcoming = bucket !== 'past';

  return {
    id: note.id,
    title: note.title,
    time: formatTime(dateSource),
    attendeeCount: note.memberCount,
    day,
    month,
    meetingDateIso: dateSource,
    isUpcoming,
    scheduleLabel:
      isUpcoming && note.meetingDate
        ? formatUpcomingScheduleLabel(note.meetingDate)
        : undefined,
  };
}

export function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isLoading, isAuthenticated, isProfileComplete: profileReady } =
    useRequireAuth({ requireProfile: true });
  const { colors } = useTheme();
  const [activeBucket, setActiveBucket] = useState<MeetingBucket>('today');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [scheduleSheetVisible, setScheduleSheetVisible] = useState(false);
  const [creatingScheduled, setCreatingScheduled] = useState(false);

  const {
    meetings: bucketNotes,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    removeMeeting,
  } = useMeetingBucket(activeBucket, isAuthenticated);

  const meetings = useMemo(
    () => bucketNotes.map((note) => mapNoteToMeeting(note, activeBucket)),
    [activeBucket, bucketNotes],
  );

  const tabCounts = useMemo(
    () => ({ [activeBucket]: meetings.length }),
    [activeBucket, meetings.length],
  );

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        void refresh();
      }
    }, [isAuthenticated, refresh]),
  );

  const handleDelete = useCallback(
    async (meeting: MeetingItem) => {
      removeMeeting(meeting.id);
      void removeMeetingFromCache(meeting.id);
      try {
        await deleteNote(meeting.id);
        setToastMessage(t('home.meetingDeleted'));
        await invalidateMeetingsCache();
        await refresh();
      } catch {
        await refresh();
      }
    },
    [refresh, removeMeeting, t],
  );

  const openNewMeetingFlow = useCallback(() => {
    setActionSheetVisible(true);
  }, []);

  const handleMeetingChoice = useCallback(
    (choice: NewMeetingChoice) => {
      setActionSheetVisible(false);
      if (choice === 'now') {
        router.push('/notes/new');
        return;
      }
      setScheduleSheetVisible(true);
    },
    [router],
  );

  const handleScheduleConfirm = useCallback(
    async (meetingDateIso: string) => {
      setCreatingScheduled(true);
      try {
        const note = await createNote({
          title: t('home.newMeeting'),
          contentJson: '',
          meetingDate: meetingDateIso,
        });
        setScheduleSheetVisible(false);
        await invalidateMeetingsCache();
        router.push(`/notes/${note.id}?new=1`);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : t('home.createFailed');
        setToastMessage(message);
      } finally {
        setCreatingScheduled(false);
      }
    },
    [router, t],
  );

  if (isLoading || !isAuthenticated || !user || !profileReady) {
    return null;
  }

  const showGlobalEmpty =
    !loading &&
    meetings.length === 0 &&
    activeBucket === 'today' &&
    !error;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.content}>
            <HomeHeader
              displayName={getDisplayName(user)}
              avatarUrl={user.avatarUrl}
              onSearch={() => router.push('/search')}
            />

            <MeetingTabs
              active={activeBucket}
              onChange={setActiveBucket}
              counts={tabCounts}
            />

            {loading && meetings.length === 0 ? (
              <View style={styles.loader}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null}

            {error && meetings.length === 0 ? (
              <Text variant="uiSm" color="error" style={styles.error}>
                {error}
              </Text>
            ) : null}

            {meetings.length > 0 ? (
              <MeetingList
                meetings={meetings}
                variant={activeBucket === 'past' ? 'recent' : 'upcoming'}
                showEmptyState={false}
                hideSectionTitle
                onMeetingPress={(meeting) => router.push(`/notes/${meeting.id}`)}
                onMeetingDelete={handleDelete}
              />
            ) : null}

            {!loading && meetings.length === 0 && !error ? (
              showGlobalEmpty ? (
                <MeetingList
                  meetings={[]}
                  onCreateMeeting={openNewMeetingFlow}
                />
              ) : (
                <MeetingTabEmptyState bucket={activeBucket} />
              )
            ) : null}

            {activeBucket === 'past' && hasMore && meetings.length > 0 ? (
              <Pressable
                onPress={() => void loadMore()}
                disabled={loadingMore}
                style={({ pressed }) => [
                  styles.loadMore,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    opacity: pressed || loadingMore ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text variant="uiSm" weight="600" color="secondary">
                    {t('home.showOlderMeetings')}
                  </Text>
                )}
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        <NewNoteFab onPress={openNewMeetingFlow} />
        <NewMeetingActionSheet
          visible={actionSheetVisible}
          onClose={() => setActionSheetVisible(false)}
          onSelect={handleMeetingChoice}
        />
        <ScheduleMeetingSheet
          visible={scheduleSheetVisible}
          onClose={() => {
            if (!creatingScheduled) setScheduleSheetVisible(false);
          }}
          onConfirm={handleScheduleConfirm}
          loading={creatingScheduled}
        />
        <SubtleToast message={toastMessage} onHidden={() => setToastMessage(null)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  loader: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  error: {
    textAlign: 'center',
  },
  loadMore: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 180,
    alignItems: 'center',
  },
});
