import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface SettingsCheckboxRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (checked: boolean) => void;
}

export function SettingsCheckboxRow({
  label,
  description,
  checked,
  disabled = false,
  onToggle,
}: SettingsCheckboxRowProps) {
  const { colors } = useTheme();
  const { direction, textAlign } = useLayoutDirection();

  return (
    <Pressable
      onPress={() => !disabled && onToggle(!checked)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        { flexDirection: 'row', direction },
        { opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <View style={styles.copy}>
        <Text variant="body" weight="500" style={{ textAlign }}>
          {label}
        </Text>
        <Text
          variant="uiSm"
          color="secondary"
          style={[styles.description, { textAlign }]}
        >
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? colors.primary : colors.surface,
            borderColor: checked ? colors.primary : colors.borderStrong,
          },
        ]}
      >
        {checked ? (
          <Feather name="check" size={14} color={colors.primaryText} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  description: {
    lineHeight: 22,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
