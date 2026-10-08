import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { formatTime } from '@/lib/format-date';
import type { NoteSearchHit, NoteSearchMatchField } from '@jalase/shared';

const MATCH_FIELD_KEYS: Record<NoteSearchMatchField, string> = {
  title: 'search.matchTitle',
  content: 'search.matchContent',
  transcript: 'search.matchTranscript',
};

interface SearchResultCardProps {
  hit: NoteSearchHit;
  onPress: (hit: NoteSearchHit) => void;
}

export function SearchResultCard({ hit, onPress }: SearchResultCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { direction, textAlign } = useLayoutDirection();
  const dateSource = hit.meetingDate ?? hit.updatedAt;

  return (
    <Pressable
      onPress={() => onPress(hit)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          alignItems: 'flex-start',
          direction,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View
        style={[styles.header, { flexDirection: 'row' }]}
      >
        <Text
          variant="body"
          weight="700"
          style={[styles.title, { textAlign }]}
          numberOfLines={1}
        >
          {hit.title}
        </Text>
        <Text variant="uiSm" color="muted">
          {formatTime(dateSource)}
        </Text>
      </View>
      <Text
        variant="uiSm"
        color="secondary"
        style={[styles.snippet, { textAlign }]}
        numberOfLines={2}
      >
        {hit.snippet}
      </Text>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: colors.primaryTint,
            borderColor: colors.border,
          },
        ]}
      >
        <Text variant="uiSm" weight="600" style={{ color: colors.primary }}>
          {t(MATCH_FIELD_KEYS[hit.matchField])}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    gap: spacing.sm,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
  snippet: {
    lineHeight: 22,
    width: '100%',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
