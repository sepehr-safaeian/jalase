import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface MetadataChipProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

export function MetadataChip({ icon, label, onPress }: MetadataChipProps) {
  const { colors } = useTheme();
  const { isRtl } = useSettings();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          flexDirection: isRtl ? 'row-reverse' : 'row',
          backgroundColor: pressed ? colors.surfaceSoft : colors.surface,
          borderColor: pressed ? colors.borderStrong : colors.border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Feather name={icon} size={13} color={colors.primaryMid} />
      <Text variant="uiSm" color="secondary" weight="500">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
