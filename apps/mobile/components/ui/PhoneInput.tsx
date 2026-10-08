import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { resolveFontFamily } from '@/theme/font-family';

export interface PhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}

export function PhoneInput({
  value,
  onChangeText,
  error,
  ...props
}: PhoneInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    onChangeText(digits);
  }

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: hasError
              ? colors.error
              : focused
                ? colors.primaryMid
                : colors.borderStrong,
          },
        ]}
      >
        <View style={[styles.prefix, { borderRightColor: colors.border }]}>
          <Text variant="body" weight="500" color="muted">
            +98
          </Text>
        </View>
        <TextInput
          autoFocus
          placeholder="912 345 6789"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={value.startsWith('0') ? value.slice(1) : value}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '');
            handleChange(digits.length > 0 ? `0${digits}` : '');
          }}
          maxLength={10}
          style={[styles.input, { color: colors.textBody }]}
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
      </View>
      {error ? (
        <Text variant="uiSm" color="error">
          {error}
        </Text>
      ) : (
        <Text variant="uiSm" color="muted">
          شماره موبایل ایران، با ۰۹ شروع می‌شود
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    writingDirection: 'ltr',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 52,
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: spacing.base,
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: 17,
    fontFamily: resolveFontFamily('500'),
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});
