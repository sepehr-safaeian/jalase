import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const BUTTON_SIZE = 44;
const ICON_SIZE = 22;

interface BackButtonProps {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function BackButton({
  onPress,
  disabled = false,
  accessibilityLabel,
}: BackButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? t('common.back')}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderStrong,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed && !disabled ? 0.96 : 1 }],
        },
      ]}
    >
      <Feather name={isRtl ? 'chevron-right' : 'chevron-left'} size={ICON_SIZE} color={colors.text} />
    </Pressable>
  );
}

export const backButtonLayout = {
  width: BUTTON_SIZE,
  height: BUTTON_SIZE,
} as const;

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: -spacing.xs,
  },
});
