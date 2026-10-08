import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface CardProps extends ViewProps {
  size?: 'md' | 'lg' | 'xl';
}

export function Card({ size = 'md', style, children, ...props }: CardProps) {
  const { colors } = useTheme();

  const borderRadius =
    size === 'xl' ? radius.xl : size === 'lg' ? radius.lg : radius.md;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: spacing.cardPadding,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
