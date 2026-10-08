import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import type { Project } from '@jalase/shared';
import { Text } from '@/components/ui/Text';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { ProjectCard } from './ProjectCard';

const ACTION_WIDTH = 88;
const OPEN_THRESHOLD = 40;

interface SwipeableProjectCardProps {
  project: Project;
  onPress?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onSwipeOpen?: (ref: Swipeable | null) => void;
}

export function SwipeableProjectCard({
  project,
  onPress,
  onDelete,
  onEdit,
  onSwipeOpen,
}: SwipeableProjectCardProps) {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  const { direction } = useLayoutDirection();
  const swipeRef = useRef<Swipeable>(null);
  const isActingRef = useRef(false);
  const blockPressRef = useRef(false);

  const deleteTint =
    scheme === 'dark' ? 'rgba(249, 112, 102, 0.14)' : 'rgba(180, 35, 24, 0.07)';
  const editTint =
    scheme === 'dark' ? 'rgba(34, 163, 93, 0.16)' : 'rgba(24, 122, 69, 0.08)';

  const triggerDelete = useCallback(() => {
    if (isActingRef.current) return;
    isActingRef.current = true;
    blockPressRef.current = true;
    onDelete?.(project);
  }, [onDelete, project]);

  const triggerEdit = useCallback(() => {
    if (isActingRef.current) return;
    isActingRef.current = true;
    blockPressRef.current = true;
    swipeRef.current?.close();
    onEdit?.(project);
    setTimeout(() => {
      isActingRef.current = false;
      blockPressRef.current = false;
    }, 320);
  }, [onEdit, project]);

  const renderDeleteAction = useCallback(() => {
    return (
      <Pressable
        onPress={triggerDelete}
        style={({ pressed }) => [
          styles.actionZone,
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

  const renderEditAction = useCallback(() => {
    return (
      <Pressable
        onPress={triggerEdit}
        style={({ pressed }) => [
          styles.actionZone,
          {
            backgroundColor: editTint,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Text variant="ui" weight="700" style={{ color: colors.primary }}>
          {t('common.edit')}
        </Text>
      </Pressable>
    );
  }, [colors.primary, editTint, t, triggerEdit]);

  const handlePress = useCallback(() => {
    if (blockPressRef.current || isActingRef.current) return;
    onPress?.(project);
  }, [onPress, project]);

  const handleSwipeStart = useCallback(() => {
    blockPressRef.current = true;
  }, []);

  const handleSwipeableWillOpen = useCallback(
    (direction: 'left' | 'right') => {
      onSwipeOpen?.(swipeRef.current);
      if (direction === 'left') {
        triggerDelete();
        return;
      }
      triggerEdit();
    },
    [onSwipeOpen, triggerDelete, triggerEdit],
  );

  const handleSwipeableClose = useCallback(() => {
    if (isActingRef.current) return;
    setTimeout(() => {
      blockPressRef.current = false;
    }, 320);
  }, []);

  return (
    <View style={[styles.shell, { direction }]}>
      <Swipeable
        ref={swipeRef}
        friction={2}
        overshootLeft={false}
        overshootRight={false}
        leftThreshold={OPEN_THRESHOLD}
        rightThreshold={OPEN_THRESHOLD}
        renderLeftActions={renderDeleteAction}
        renderRightActions={renderEditAction}
        onSwipeableOpenStartDrag={handleSwipeStart}
        onSwipeableWillOpen={handleSwipeableWillOpen}
        onSwipeableClose={handleSwipeableClose}
      >
        <ProjectCard project={project} onPress={handlePress} />
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  actionZone: {
    width: ACTION_WIDTH,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
