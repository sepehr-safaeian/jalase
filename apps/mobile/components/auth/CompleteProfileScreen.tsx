import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen } from '@/components/layout/AppScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { spacing } from '@/theme/tokens';

export function CompleteProfileScreen() {
  const router = useRouter();
  const { completeProfile, isProfileComplete } = useAuth();
  const { isLoading, isAuthenticated } = useRequireAuth({
    redirectIfProfileComplete: true,
  });
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isProfileComplete) {
      router.replace('/dashboard');
    }
  }, [isProfileComplete, router]);

  if (isLoading || !isAuthenticated || isProfileComplete) {
    return null;
  }

  const trimmed = displayName.trim();
  const canSubmit = trimmed.length >= 2;

  async function handleSubmit() {
    if (!canSubmit) {
      setError('نام را وارد کنید');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await completeProfile(trimmed);
      router.replace('/dashboard');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ذخیره ناموفق بود. دوباره تلاش کنید';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen
      keyboard
      footer={
        <Button
          label="ادامه"
          loading={loading}
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={styles.fullWidth}
        />
      }
    >
      <View style={styles.header}>
        <Text variant="headingSm" weight="700" style={styles.title}>
          شما را چی صدا بزنم؟
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          برای شخصی‌سازی تجربه، نام خود را وارد کنید
        </Text>
      </View>

      <Input
        value={displayName}
        onChangeText={(value) => {
          setDisplayName(value);
          if (error) setError(null);
        }}
        placeholder="نام و نام خانوادگی"
        autoFocus
        error={error ?? undefined}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  title: {
    textAlign: 'right',
  },
  subtitle: {
    textAlign: 'right',
    lineHeight: 24,
  },
});
