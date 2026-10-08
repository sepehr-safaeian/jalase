import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme/tokens';

/** Shared placeholder for billing routes while payments are turned off */
export function BillingDisabledScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Screen scroll>
      <AppHeader title={t('subscription.disabledTitle')} />

      <Card style={styles.card}>
        <Text variant="headingSm" weight="700" style={styles.centered}>
          {t('subscription.disabledTitle')}
        </Text>
        <Text variant="body" color="secondary" style={[styles.centered, styles.body]}>
          {t('subscription.disabledBody')}
        </Text>
      </Card>

      <Button
        label={t('subscription.backHome')}
        onPress={() => router.replace('/')}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  centered: {
    textAlign: 'center',
  },
  body: {
    lineHeight: 24,
  },
  cta: {
    width: '100%',
  },
});
