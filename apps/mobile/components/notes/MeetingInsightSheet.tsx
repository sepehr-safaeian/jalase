import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { MeetingAiExtractions, MeetingExtractionKind } from '@jalase/shared';
import {
  MEETING_EXTRACTION_META,
  MEETING_EXTRACTION_ORDER,
  isMeetingExtractionUsed,
} from '@jalase/shared';
import { BottomSheet } from '@/components/notes/BottomSheet';
import { Text } from '@/components/ui/Text';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const ICONS: Record<MeetingExtractionKind, keyof typeof Feather.glyphMap> = {
  summary: 'file-text',
  decisions: 'check-circle',
  next_actions: 'list',
  highlights: 'star',
};

const TITLE_KEYS: Record<MeetingExtractionKind, string> = {
  summary: 'notes.defaultSections.summary',
  decisions: 'notes.defaultSections.decisions',
  next_actions: 'notes.defaultSections.nextActions',
  highlights: 'notes.defaultSections.highlights',
};

interface MeetingInsightSheetProps {
  visible: boolean;
  aiExtractions?: MeetingAiExtractions;
  onClose: () => void;
  onExtract: (kind: MeetingExtractionKind) => Promise<void>;
  onNotify?: (message: string) => void;
}

export function MeetingInsightSheet({
  visible,
  aiExtractions = {},
  onClose,
  onExtract,
  onNotify,
}: MeetingInsightSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { textAlign } = useLayoutDirection();
  const [busyKind, setBusyKind] = useState<MeetingExtractionKind | null>(null);

  async function handleSelect(kind: MeetingExtractionKind) {
    if (busyKind || isMeetingExtractionUsed(aiExtractions, kind)) return;

    setBusyKind(kind);
    try {
      await onExtract(kind);
      onNotify?.(
        t('notes.insightApplied', {
          heading: t(TITLE_KEYS[kind]),
        }),
      );
      onClose();
    } catch (err) {
      onNotify?.(
        err instanceof Error ? err.message : t('notes.insightFailed'),
      );
    } finally {
      setBusyKind(null);
    }
  }

  return (
    <BottomSheet visible={visible} title={t('notes.insightsTitle')} onClose={onClose}>
      <View style={styles.list}>
        {MEETING_EXTRACTION_ORDER.map((kind) => {
          const meta = MEETING_EXTRACTION_META[kind];
          const used = isMeetingExtractionUsed(aiExtractions, kind);
          const busy = busyKind === kind;

          return (
            <Pressable
              key={kind}
              disabled={Boolean(busyKind) || used}
              onPress={() => void handleSelect(kind)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: used ? colors.surfaceSoft : colors.surface,
                  borderColor: colors.border,
                  opacity: used ? 0.65 : pressed ? 0.88 : 1,
                  transform: [{ scale: pressed && !used ? 0.985 : 1 }],
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.primaryTint },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Feather name={ICONS[kind]} size={18} color={colors.primary} />
                )}
              </View>
              <View style={styles.copy}>
                <Text variant="body" weight="600" style={{ textAlign }}>
                  {t(TITLE_KEYS[kind])}
                </Text>
                <Text variant="uiSm" color="muted" style={{ textAlign }}>
                  {meta.subtitle}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
});
