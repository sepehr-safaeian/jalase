import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Project } from '@jalase/shared';
import { PROJECT_COLOR_PRESETS } from '@jalase/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { BottomSheet } from '@/components/notes/BottomSheet';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface ProjectEditSheetProps {
  visible: boolean;
  project?: Project | null;
  onClose: () => void;
  onSave: (payload: { name: string; color: string | null }) => Promise<void>;
}

export function ProjectEditSheet({
  visible,
  project,
  onClose,
  onSave,
}: ProjectEditSheetProps) {
  const { colors } = useTheme();
  const isEdit = Boolean(project);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | null>(PROJECT_COLOR_PRESETS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(project?.name ?? '');
    setColor(project?.color ?? PROJECT_COLOR_PRESETS[0]);
  }, [project, visible]);

  async function handleSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;

    setLoading(true);
    try {
      await onSave({ name: trimmed, color });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      title={isEdit ? 'ویرایش پروژه' : 'پروژه جدید'}
      onClose={onClose}
    >
      <View style={styles.form}>
        <Input
          placeholder="نام پروژه"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.colorsBlock}>
          <Text variant="ui" weight="600" color="secondary">
            رنگ
          </Text>
          <View style={styles.colors}>
            {PROJECT_COLOR_PRESETS.map((preset) => {
              const selected = color === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => setColor(preset)}
                  style={[
                    styles.colorSwatch,
                    {
                      backgroundColor: preset,
                      borderColor: selected ? colors.text : colors.border,
                      borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                />
              );
            })}
          </View>
        </View>

        <Button
          label={isEdit ? 'ذخیره تغییرات' : 'ایجاد پروژه'}
          loading={loading}
          onPress={() => void handleSave()}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.base,
  },
  colorsBlock: {
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  colors: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
  },
});
