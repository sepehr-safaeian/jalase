import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NoteSummary, Project } from '@jalase/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { MeetingList } from '@/components/home/MeetingList';
import type { MeetingItem } from '@/components/home/types';
import { Text } from '@/components/ui/Text';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { formatDateParts, formatTime } from '@/lib/format-date';
import { formatUpcomingScheduleLabel } from '@/lib/schedule-date';
import { getProject, listProjectMeetings } from '@/lib/api/projects.api';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radius, spacing } from '@/theme/tokens';

function mapNoteToMeeting(note: NoteSummary): MeetingItem {
  const dateSource = note.meetingDate ?? note.createdAt;
  const date = new Date(dateSource);
  const day = date.getDate();
  const { month } = formatDateParts(dateSource);
  const now = Date.now();
  const isUpcoming = date.getTime() >= now;

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

export function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { direction, textAlign } = useLayoutDirection();
  const { isLoading, isAuthenticated } = useRequireAuth({ requireProfile: true });
  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meetingItems = useMemo(
    () => meetings.map((note) => mapNoteToMeeting(note)),
    [meetings],
  );

  const loadData = useCallback(
    async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
      if (!id) return;

      if (mode === 'more') {
        if (!cursor) return;
        setLoadingMore(true);
      } else if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [projectData, meetingsData] = await Promise.all([
          mode === 'more' ? Promise.resolve(project) : getProject(id),
          listProjectMeetings(id, {
            cursor: mode === 'more' ? cursor ?? undefined : undefined,
          }),
        ]);

        if (mode !== 'more' && projectData) {
          setProject(projectData);
        }

        if (mode === 'more') {
          setMeetings((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            return [
              ...prev,
              ...meetingsData.items.filter((item) => !seen.has(item.id)),
            ];
          });
        } else {
          setMeetings(meetingsData.items);
        }

        setCursor(meetingsData.nextCursor);
        setHasMore(meetingsData.hasMore);
        setError(null);
      } catch {
        if (mode !== 'more') {
          setError(t('projects.detailLoadFailed'));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [cursor, id, project, t],
  );

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && id) {
        setCursor(null);
        void loadData('initial');
      }
    }, [id, isAuthenticated]),
  );

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const accent = project?.color ?? colors.primary;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas, direction }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setCursor(null);
              void loadData('refresh');
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.content}>
          <AppHeader title={project?.name ?? t('projects.fallbackTitle')} />

          {loading && !project ? (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          {error ? (
            <Text variant="uiSm" color="error" style={styles.error}>
              {error}
            </Text>
          ) : null}

          {project ? (
            <>
              <View
                style={[
                  styles.hero,
                  {
                    flexDirection: 'row',
                    alignSelf: 'flex-start',
                  },
                ]}
              >
                <View style={[styles.heroDot, { backgroundColor: accent }]} />
                <Text variant="body" color="secondary" style={{ textAlign }}>
                  {project.noteCount === 0
                    ? t('projects.noMeetingsInProject')
                    : t('projects.meetingsInProject', {
                        count: project.noteCount,
                      })}
                </Text>
              </View>

              {meetingItems.length > 0 ? (
                <MeetingList
                  meetings={meetingItems}
                  title={t('projects.meetingsTitle')}
                  hideSectionTitle={false}
                  showEmptyState={false}
                  onMeetingPress={(meeting) => router.push(`/notes/${meeting.id}`)}
                />
              ) : !loading ? (
                <View style={styles.empty}>
                  <Text variant="headingSm" weight="600" style={{ textAlign }}>
                    {t('projects.noMeetingsLogged')}
                  </Text>
                  <Text
                    variant="body"
                    color="muted"
                    style={[styles.emptyBody, { textAlign }]}
                  >
                    {t('projects.chooseProjectHint')}
                  </Text>
                </View>
              ) : null}

              {hasMore && meetingItems.length > 0 ? (
                <Pressable
                  onPress={() => void loadData('more')}
                  disabled={loadingMore}
                  style={({ pressed }) => [
                    styles.loadMore,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      opacity: pressed || loadingMore ? 0.85 : 1,
                    },
                  ]}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text variant="uiSm" weight="600" color="secondary">
                      {t('projects.showMoreMeetings')}
                    </Text>
                  )}
                </Pressable>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'],
  },
  content: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.section,
    gap: spacing.lg,
  },
  loader: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  error: {
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  empty: {
    gap: spacing.sm,
    alignItems: 'stretch',
    paddingTop: spacing.xl,
  },
  emptyBody: {
    lineHeight: 24,
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
