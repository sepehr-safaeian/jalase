import { useState } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  type TextInputProps,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme, useSettings } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { resolveFontFamily } from '@/theme/font-family';

export interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, style, ...props }: InputProps) {
  const { colors } = useTheme();
  const { fontScale, isRtl } = useSettings();
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="uiSm" weight="500" color="primary">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: hasError
              ? colors.error
              : focused
                ? colors.primaryMid
                : colors.border,
            color: colors.textBody,
            fontSize: 15 * fontScale,
            textAlign: isRtl ? 'right' : 'left',
            writingDirection: isRtl ? 'rtl' : 'ltr',
          },
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error ? (
        <Text variant="uiSm" color="error">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="uiSm" color="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontFamily: resolveFontFamily('400'),
  },
});
