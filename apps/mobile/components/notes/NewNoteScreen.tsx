import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { createNote } from '@/lib/api/notes.api';
import { ApiError } from '@/lib/api/client';
import {
  buildDefaultNoteDoc,
  serializeNoteContent,
} from '@/lib/notes/note-content';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export function NewNoteScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void createNote({
      title: t('meetings.untitled'),
      contentJson: serializeNoteContent(
        buildDefaultNoteDoc({
          summary: t('notes.defaultSections.summary'),
          decisions: t('notes.defaultSections.decisions'),
          nextActions: t('notes.defaultSections.nextActions'),
          highlights: t('notes.defaultSections.highlights'),
        }),
      ),
    })
      .then((note) => {
        router.replace(`/notes/${note.id}?new=1`);
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : t('home.createFailed');
        setError(message);
        setLoading(false);
      });
  }, [router, t]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <View style={styles.center}>
        {loading && !error ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
        {error ? (
          <View style={styles.errorBox}>
            <Text variant="body" color="error" style={styles.errorText}>
              {error}
            </Text>
            <Button
              label={t('common.back')}
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorBox: { gap: spacing.base, alignItems: 'center', maxWidth: 320 },
  errorText: { textAlign: 'center', lineHeight: 24 },
});
