import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { BackButton, backButtonLayout } from '@/components/ui/BackButton';
import { spacing } from '@/theme/tokens';

interface AppHeaderProps {
  onBack?: () => void;
  title?: string;
}

export function AppHeader({ onBack, title }: AppHeaderProps) {
  const router = useRouter();
  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  }

  return (
    <View style={[styles.row, { flexDirection: 'row' }]}>
      <BackButton onPress={handleBack} />
      {title ? (
        <Text variant="body" weight="600" style={styles.title}>
          {title}
        </Text>
      ) : (
        <View style={styles.titleSpacer} />
      )}
      <View style={styles.balanceSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    minHeight: 52,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  titleSpacer: {
    flex: 1,
  },
  balanceSpacer: {
    width: backButtonLayout.width,
  },
});
