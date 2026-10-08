import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { Project } from '@jalase/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { listProjects, createProject } from '@/lib/api/projects.api';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { BottomSheet } from './BottomSheet';

interface NoteProjectSheetProps {
  visible: boolean;
  selectedProjectId: string | null;
  onClose: () => void;
  onSelect: (projectId: string | null) => void;
}

export function NoteProjectSheet({
  visible,
  selectedProjectId,
  onClose,
  onSelect,
}: NoteProjectSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const rowDirection = isRtl ? 'row-reverse' : 'row';
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowCreate(false);
      return;
    }
    void listProjects().then(setProjects).catch(() => setProjects([]));
  }, [visible]);

  async function handleCreate() {
    const name = newName.trim();
    if (name.length < 2) return;

    setLoading(true);
    try {
      const project = await createProject({ name });
      setProjects((prev) => [project, ...prev]);
      setNewName('');
      onSelect(project.id);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet visible={visible} title={t('notes.projectSheetTitle')} onClose={onClose}>
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ProjectRow
          label={t('notes.noProject')}
          active={selectedProjectId === null}
          onPress={() => {
            onSelect(null);
            onClose();
          }}
        />

        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            label={project.name}
            active={selectedProjectId === project.id}
            color={project.color}
            onPress={() => {
              onSelect(project.id);
              onClose();
            }}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {showCreate ? (
          <View style={styles.createForm}>
            <Input
              placeholder={t('notes.projectNamePlaceholder')}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <Button label={t('common.create')} loading={loading} onPress={handleCreate} />
          </View>
        ) : (
          <Pressable
            onPress={() => setShowCreate(true)}
            style={({ pressed }) => [
              styles.addRow,
              { flexDirection: rowDirection, opacity: pressed ? 0.55 : 1 },
            ]}
          >
            <Feather name="plus" size={16} color={colors.textMuted} />
            <Text variant="body" color="muted">
              {t('notes.newProject')}
            </Text>
          </Pressable>
        )}
      </View>
    </BottomSheet>
  );
}

function ProjectRow({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string | null;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const rowDirection = isRtl ? 'row-reverse' : 'row';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { flexDirection: rowDirection, opacity: pressed ? 0.55 : 1 },
      ]}
    >
      <View style={[styles.rowContent, { flexDirection: rowDirection }]}>
        {color ? (
          <View style={[styles.dot, { backgroundColor: color }]} />
        ) : null}
        <Text variant="body" weight={active ? '600' : '400'}>
          {label}
        </Text>
      </View>
      {active ? (
        <Feather name="check" size={18} color={colors.primary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
    minHeight: 48,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  createForm: {
    gap: spacing.md,
  },
});
