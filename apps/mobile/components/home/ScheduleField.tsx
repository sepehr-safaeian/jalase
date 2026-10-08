import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface ScheduleFieldProps {
  label: string;
  value: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function ScheduleField({
  label,
  value,
  onPress,
  accessibilityLabel,
}: ScheduleFieldProps) {
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const align = isRtl ? 'right' : 'left';

  return (
    <View style={styles.wrapper}>
      <Text
        variant="uiSm"
        weight="500"
        color="secondary"
        style={{ textAlign: align }}
      >
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [
          styles.field,
          {
            flexDirection: isRtl ? 'row-reverse' : 'row',
            backgroundColor: colors.surface,
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <Text
          variant="body"
          weight="600"
          style={[styles.value, { textAlign: align }]}
        >
          {value}
        </Text>
        <Text variant="ui" color="muted" weight="500">
          ▾
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  field: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  value: {
    flex: 1,
  },
});
