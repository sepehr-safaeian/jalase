import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AudioFrequencyVisualizer } from './AudioFrequencyVisualizer';

interface MeetingRecorderScreenProps {
  noteId: string;
  isNew?: boolean;
}

/** Native: live recording is web-only for now; this is a placeholder with brand copy. */
export function MeetingRecorderScreen({ noteId, isNew = false }: MeetingRecorderScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth({
    requireProfile: true,
  });

  const openEditor = useCallback(() => {
    router.replace(isNew ? `/notes/${noteId}?new=1` : `/notes/${noteId}`);
  }, [isNew, noteId, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <View style={styles.body}>
        <AudioFrequencyVisualizer stream={null} isActive={false} size={260} />
        <View style={styles.copy}>
          <Text variant="headingSm" weight="700">
            {t('recorder.brandName')}
          </Text>
          <Text variant="uiSm" color="muted" style={styles.tagline}>
            {t('recorder.brandTagline')}
          </Text>
          <Text variant="body" color="muted" style={styles.message}>
            {t('recorder.nativeBody')}
          </Text>
        </View>
        <Button label={t('recorder.openNote')} variant="primary" onPress={openEditor} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 320,
  },
  tagline: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 24,
    marginTop: spacing.sm,
  },
});
