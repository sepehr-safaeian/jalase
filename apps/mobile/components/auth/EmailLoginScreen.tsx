import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppScreen } from '@/components/layout/AppScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OtpInput } from '@/components/ui/OtpInput';
import { Text } from '@/components/ui/Text';
import { sendEmailOtp, verifyEmailOtp } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/AuthContext';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function EmailLoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);

  const isEmailStep = step === 'email';
  const canSubmit = isEmailStep
    ? isValidEmail(email)
    : code.length === 6;
  const align = isRtl ? 'right' : 'left';

  async function handleSendCode() {
    if (!isValidEmail(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await sendEmailOtp(email.trim().toLowerCase());
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
    if (!isValidEmail(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await verifyEmailOtp(email.trim().toLowerCase(), code);
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
    if (isEmailStep) {
      router.back();
      return;
    }
    setStep('email');
    setCode('');
    setError(null);
    setDevCodeHint(null);
  }

  return (
    <AppScreen>
      <AppHeader title={t('auth.loginTitle')} onBack={handleBack} />

      <View style={styles.body}>
        <Text variant="headingSm" weight="700" style={{ textAlign: align }}>
          {isEmailStep ? t('auth.loginTitle') : t('auth.verifyTitle')}
        </Text>
        <Text
          variant="body"
          color="secondary"
          style={{ textAlign: align, lineHeight: 24 }}
        >
          {isEmailStep
            ? t('auth.loginSubtitle')
            : t('auth.verifySubtitle', { destination: email.trim() })}
        </Text>

        {isEmailStep ? (
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
        ) : (
          <OtpInput
            value={code}
            onChangeText={(value) => {
              setCode(value);
              if (error) setError(null);
            }}
          />
        )}

        {devCodeHint ? (
          <Text variant="uiSm" color="muted" style={{ textAlign: align }}>
            {devCodeHint}
          </Text>
        ) : null}

        {error ? (
          <Text variant="uiSm" color="error" style={{ textAlign: align }}>
            {error}
          </Text>
        ) : null}

        <Button
          label={isEmailStep ? t('auth.sendCode') : t('auth.verify')}
          loading={loading}
          disabled={!canSubmit}
          onPress={() =>
            void (isEmailStep ? handleSendCode() : handleVerify())
          }
        />

        <Pressable
          onPress={() => router.push('/login/phone')}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text
            variant="uiSm"
            weight="500"
            style={{ textAlign: 'center', color: colors.primary }}
          >
            {t('auth.usePhone')}
          </Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.base,
    paddingTop: spacing.xl,
  },
});
