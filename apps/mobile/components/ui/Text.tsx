import {
  Text as RNText,
  type TextProps as RNTextProps,
} from 'react-native';
import { useTheme, useSettings } from '@/theme/ThemeProvider';
import {
  isDisplayVariant,
  typography,
  type TypographyVariant,
} from '@/theme/typography';
import { resolveFontFamily } from '@/theme/font-family';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  weight?: '400' | '500' | '600' | '700';
  color?: 'primary' | 'secondary' | 'muted' | 'quiet' | 'error' | 'inherit';
}

function defaultWeightForVariant(variant: TypographyVariant): '400' | '600' | '700' {
  if (variant === 'display' || variant === 'headingLg') return '700';
  if (variant === 'heading' || variant === 'headingMd') return '600';
  return '400';
}

export function Text({
  style,
  variant = 'body',
  weight,
  color = 'inherit',
  ...props
}: TextProps) {
  const { colors } = useTheme();
  const { fontScale } = useSettings();
  const variantStyle = typography[variant];
  const resolvedWeight = weight ?? (isDisplayVariant(variant) ? defaultWeightForVariant(variant) : '400');

  const textColor =
    color === 'inherit'
      ? colors.text
      : color === 'primary'
        ? colors.text
        : color === 'secondary'
          ? colors.textSecondary
          : color === 'muted'
            ? colors.textMuted
            : color === 'quiet'
              ? colors.textQuiet
              : colors.error;

  return (
    <RNText
      {...props}
      style={[
        { fontFamily: resolveFontFamily(resolvedWeight), fontWeight: 'normal' },
        {
          fontSize: (variantStyle.fontSize ?? 16) * fontScale,
          lineHeight: (variantStyle.lineHeight ?? 24) * fontScale,
          letterSpacing: variantStyle.letterSpacing,
        },
        { color: textColor },
        style,
      ]}
    />
  );
}
