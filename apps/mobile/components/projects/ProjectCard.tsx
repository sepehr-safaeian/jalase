import { StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { Project } from '@jalase/shared';
import { Text } from '@/components/ui/Text';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface ProjectCardProps {
  project: Project;
  onPress?: (project: Project) => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl, direction, textAlign } = useLayoutDirection();
  const accent = project.color ?? colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.985}
      onPress={() => onPress?.(project)}
      style={[
        styles.card,
        {
          flexDirection: 'row',
          direction,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.content, { alignItems: 'flex-start' }]}>
        <View style={[styles.titleRow, { flexDirection: 'row' }]}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text
            variant="body"
            weight="600"
            style={[styles.title, { textAlign }]}
            numberOfLines={2}
          >
            {project.name}
          </Text>
        </View>
        <Text variant="uiSm" color="muted" style={{ textAlign }}>
          {project.noteCount === 0
            ? t('projects.noMeetings')
            : t('projects.meetingCount', { count: project.noteCount })}
        </Text>
      </View>

      <Feather name={isRtl ? 'chevron-left' : 'chevron-right'} size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    lineHeight: 24,
  },
});
