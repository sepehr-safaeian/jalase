import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const OTP_LENGTH = 6;

export interface OtpInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
}

export function OtpInput({
  value,
  onChangeText,
  error,
  hint,
  ...props
}: OtpInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  function handleChange(raw: string) {
    onChangeText(raw.replace(/\D/g, '').slice(0, OTP_LENGTH));
  }

  const focusIndex =
    value.length >= OTP_LENGTH ? OTP_LENGTH - 1 : value.length;

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputLayer}>
        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={styles.boxRow}
          accessibilityRole="none"
        >
          {digits.map((digit, index) => {
            const isActive = focused && index === focusIndex;
            return (
              <View
                key={index}
                style={[
                  styles.box,
                  {
                    backgroundColor: colors.surface,
                    borderColor: hasError
                      ? colors.error
                      : isActive
                        ? colors.primaryMid
                        : colors.borderStrong,
                  },
                ]}
              >
                <Text variant="headingSm" weight="600">
                  {digit}
                </Text>
              </View>
            );
          })}
        </Pressable>
        <TextInput
          ref={inputRef}
          autoFocus
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          caretHidden
          style={styles.overlayInput}
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
  inputLayer: {
    position: 'relative',
    height: 52,
    writingDirection: 'ltr',
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    height: 52,
  },
  box: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: 'transparent',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});
