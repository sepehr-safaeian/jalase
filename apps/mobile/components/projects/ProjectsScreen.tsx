import { useCallback, useRef, useState } from 'react';
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
import type Swipeable from 'react-native-gesture-handler/Swipeable';
import type { Project } from '@jalase/shared';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { SubtleToast } from '@/components/ui/SubtleToast';
import { Text } from '@/components/ui/Text';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '@/lib/api/projects.api';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { layout, radius, spacing } from '@/theme/tokens';
import { ProjectEditSheet } from './ProjectEditSheet';
import { SwipeableProjectCard } from './SwipeableProjectCard';

export function ProjectsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const textAlign = isRtl ? 'right' : 'left';
  const { isLoading, isAuthenticated } = useRequireAuth({ requireProfile: true });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const openSwipeRef = useRef<Swipeable | null>(null);

  const loadProjects = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const items = await listProjects();
      setProjects(items);
      setError(null);
    } catch {
      setError(t('projects.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        void loadProjects();
      }
    }, [isAuthenticated, loadProjects]),
  );

  const handleDelete = useCallback(
    async (project: Project) => {
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
      try {
        await deleteProject(project.id);
        setToastMessage(t('projects.deleted'));
      } catch {
        await loadProjects('refresh');
      }
    },
    [loadProjects, t],
  );

  const handleEdit = useCallback((project: Project) => {
    setEditingProject(project);
    setSheetVisible(true);
  }, []);

  const handleCreatePress = useCallback(() => {
    setEditingProject(null);
    setSheetVisible(true);
  }, []);

  const handleSave = useCallback(
    async (payload: { name: string; color: string | null }) => {
      if (editingProject) {
        const updated = await updateProject(editingProject.id, payload);
        setProjects((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setToastMessage(t('projects.updated'));
        return;
      }

      const created = await createProject(payload);
      setProjects((prev) => [created, ...prev]);
      setToastMessage(t('projects.created'));
    },
    [editingProject, t],
  );

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadProjects('refresh')}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.content}>
          <AppHeader title={t('projects.title')} />

          <View style={styles.intro}>
            <Text variant="headingSm" weight="700" style={{ textAlign }}>
              {t('projects.yourProjects')}
            </Text>
            <Text
              variant="body"
              color="secondary"
              style={[styles.introBody, { textAlign }]}
            >
              {t('projects.introBody')}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          {error && projects.length === 0 ? (
            <Text variant="uiSm" color="error" style={styles.error}>
              {error}
            </Text>
          ) : null}

          {!loading && projects.length === 0 && !error ? (
            <View
              style={[
                styles.empty,
                { alignItems: isRtl ? 'flex-end' : 'flex-start' },
              ]}
            >
              <Text variant="headingSm" weight="600">
                {t('projects.emptyTitle')}
              </Text>
              <Text
                variant="body"
                color="muted"
                style={[styles.emptyBody, { textAlign }]}
              >
                {t('projects.emptyBody')}
              </Text>
              <Button label={t('projects.new')} onPress={handleCreatePress} />
            </View>
          ) : null}

          {projects.length > 0 ? (
            <View style={styles.list}>
              {projects.map((project) => (
                <SwipeableProjectCard
                  key={project.id}
                  project={project}
                  onPress={(item) => router.push(`/projects/${item.id}`)}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onSwipeOpen={(ref) => {
                    if (openSwipeRef.current && openSwipeRef.current !== ref) {
                      openSwipeRef.current.close();
                    }
                    openSwipeRef.current = ref;
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {projects.length > 0 ? (
        <Pressable
          onPress={handleCreatePress}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
          accessibilityLabel={t('projects.new')}
          accessibilityRole="button"
        >
          <Text variant="body" weight="700" style={{ color: colors.primaryText }}>
            +
          </Text>
        </Pressable>
      ) : null}

      <ProjectEditSheet
        visible={sheetVisible}
        project={editingProject}
        onClose={() => {
          setSheetVisible(false);
          setEditingProject(null);
        }}
        onSave={handleSave}
      />

      <SubtleToast message={toastMessage} onHidden={() => setToastMessage(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
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
    paddingTop: spacing.section,
    gap: spacing.lg,
  },
  intro: {
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  introBody: {
    lineHeight: 24,
  },
  loader: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  error: {
    textAlign: 'center',
  },
  empty: {
    gap: spacing.base,
    paddingTop: spacing['2xl'],
  },
  emptyBody: {
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
