import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppScreen } from '@/components/layout/AppScreen';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Text } from '@/components/ui/Text';
import {
  formatIranPhoneDisplay,
  isValidIranPhone,
  toIranE164,
} from '@/components/auth/phone.utils';
import { sendOtp, verifyOtp } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/AuthContext';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export function PhoneLoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);

  const isPhoneStep = step === 'phone';
  const canSubmit = isPhoneStep
    ? isValidIranPhone(phone)
    : code.length === 6;
  const align = isRtl ? 'right' : 'left';

  async function handleSendCode() {
    const e164 = toIranE164(phone);
    if (!e164) {
      setError(t('auth.invalidPhone'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await sendOtp(e164);
      setDevCodeHint(
        result.devCode ? t('auth.devCode', { code: result.devCode }) : null,
      );
      setStep('otp');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('errors.generic');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    const e164 = toIranE164(phone);
    if (!e164) {
      setError(t('auth.invalidPhone'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await verifyOtp(e164, code);
      await signIn(result);
      router.replace('/auth/welcome');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('errors.generic');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    if (isPhoneStep) {
      router.back();
      return;
    }
    setStep('phone');
    setCode('');
    setError(null);
    setDevCodeHint(null);
  }

  const formattedPhone = formatIranPhoneDisplay(phone);

  return (
    <AppScreen
      keyboard
      footer={
        <>
          <Button
            label={isPhoneStep ? t('auth.sendCode') : t('auth.verify')}
            loading={loading}
            disabled={!canSubmit}
            onPress={isPhoneStep ? handleSendCode : handleVerify}
            style={styles.fullWidth}
          />
          {isPhoneStep ? (
            <Pressable
              onPress={() => router.push('/login/email')}
              style={({ pressed }) => [
                styles.textAction,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                variant="ui"
                weight="500"
                style={{ color: colors.primaryMid }}
              >
                {t('auth.useEmail')}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                setStep('phone');
                setCode('');
                setError(null);
                setDevCodeHint(null);
              }}
              style={({ pressed }) => [
                styles.textAction,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                variant="ui"
                weight="500"
                style={{ color: colors.primaryMid }}
              >
                {t('auth.phone')}
              </Text>
            </Pressable>
          )}
        </>
      }
    >
      <AppHeader onBack={handleBack} />

      <View
        style={[
          styles.stepIndicator,
          { flexDirection: isRtl ? 'row-reverse' : 'row' },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <View
          style={[
            styles.dot,
            {
              backgroundColor: isPhoneStep ? colors.border : colors.primary,
            },
          ]}
        />
      </View>

      <View style={styles.header}>
        <Text
          variant="headingSm"
          weight="700"
          style={{ textAlign: align }}
        >
          {isPhoneStep ? t('auth.loginTitle') : t('auth.verifyTitle')}
        </Text>
        {isPhoneStep ? (
          <Text
            variant="body"
            color="secondary"
            style={{ textAlign: align, lineHeight: 24 }}
          >
            {t('auth.loginPhoneSubtitle')}
          </Text>
        ) : (
          <Text
            variant="body"
            color="secondary"
            style={{ textAlign: align, lineHeight: 24 }}
          >
            {t('auth.verifySubtitle', { destination: formattedPhone })}
          </Text>
        )}
      </View>

      <View style={styles.form}>
        {isPhoneStep ? (
          <PhoneInput
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              if (error) setError(null);
            }}
            error={error ?? undefined}
          />
        ) : (
          <OtpInput
            value={code}
            onChangeText={(value) => {
              setCode(value);
              if (error) setError(null);
            }}
            error={error ?? undefined}
            hint={devCodeHint ?? undefined}
          />
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  textAction: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  stepIndicator: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  form: {
    flex: 1,
  },
});
