import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'soft' | 'destructive';
  loading?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'destructive'
        ? colors.surface
        : variant === 'soft'
          ? colors.primaryTint
          : colors.surface;

  const textColor =
    variant === 'primary'
      ? colors.primaryText
      : variant === 'destructive'
        ? colors.error
        : colors.text;

  const borderColor =
    variant === 'destructive'
      ? colors.error
      : variant === 'secondary'
        ? colors.borderStrong
        : colors.border;

  return (
    <Pressable
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        {
          backgroundColor,
          borderColor,
          opacity: isDisabled ? 0.5 : 1,
          transform: [{ scale: state.pressed && !isDisabled ? 0.97 : 1 }],
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.primaryText : colors.primary}
          size="small"
        />
      ) : (
        <Text weight="600" variant="body" style={{ color: textColor }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
