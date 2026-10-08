import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { NoteDetail } from '@jalase/shared';
import { BottomSheet } from '@/components/notes/BottomSheet';
import { Text } from '@/components/ui/Text';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import {
  copyNoteContent,
  downloadNoteMarkdown,
  downloadNotePdf,
  shareNoteToTelegram,
  shareNoteToWhatsApp,
  shareNoteViaSms,
  shareNoteWithSystemSheet,
} from '@/lib/notes/share-note';

export type NoteShareAction =
  | 'copy'
  | 'pdf'
  | 'markdown'
  | 'telegram'
  | 'whatsapp'
  | 'sms'
  | 'system';

interface NoteShareSheetProps {
  visible: boolean;
  note: NoteDetail;
  onClose: () => void;
  onNotify?: (message: string) => void;
}

type ShareOption = {
  key: NoteShareAction;
  title: string;
  icon: keyof typeof Feather.glyphMap;
};

type ShareSection = { id: string; label: string; options: ShareOption[] };

function buildSections(t: TFunction): ShareSection[] {
  return [
    {
      id: 'export',
      label: t('notes.shareSectionExport'),
      options: [
        { key: 'copy', title: t('notes.shareCopy'), icon: 'copy' },
        { key: 'pdf', title: t('notes.sharePdf'), icon: 'file-text' },
        { key: 'markdown', title: t('notes.shareMarkdown'), icon: 'download' },
      ],
    },
    {
      id: 'send',
      label: t('notes.shareSectionSend'),
      options: [
        { key: 'telegram', title: t('notes.shareTelegram'), icon: 'send' },
        {
          key: 'whatsapp',
          title: t('notes.shareWhatsapp'),
          icon: 'message-circle',
        },
        { key: 'sms', title: t('notes.shareSms'), icon: 'smartphone' },
        { key: 'system', title: t('notes.shareOther'), icon: 'share-2' },
      ],
    },
  ];
}

function toExportSource(note: NoteDetail) {
  return {
    title: note.title,
    contentJson: note.contentJson,
    contentMarkdown: note.contentMarkdown,
    transcriptText: note.transcriptText,
    transcriptTurns: note.transcriptTurns,
    meetingDate: note.meetingDate,
    projectName: note.projectName,
    memberCount: note.memberCount,
  };
}

interface ShareRowProps {
  option: ShareOption;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}

function ShareRow({ option, busy, disabled, onPress }: ShareRowProps) {
  const { colors } = useTheme();
  const { isRtl } = useSettings();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={option.title}
      style={({ pressed }) => [
        styles.row,
        {
          flexDirection: isRtl ? 'row-reverse' : 'row',
          backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
          opacity: disabled && !busy ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View
        style={[styles.rowMain, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Feather name={option.icon} size={19} color={colors.textSecondary} />
        )}
        <Text
          variant="body"
          weight="500"
          style={[styles.rowTitle, { textAlign: isRtl ? 'right' : 'left' }]}
        >
          {option.title}
        </Text>
      </View>
      {!busy ? (
        <Feather
          name={isRtl ? 'chevron-left' : 'chevron-right'}
          size={16}
          color={colors.textQuiet}
        />
      ) : null}
    </Pressable>
  );
}

export function NoteShareSheet({
  visible,
  note,
  onClose,
  onNotify,
}: NoteShareSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const [busyKey, setBusyKey] = useState<NoteShareAction | null>(null);
  const source = toExportSource(note);
  const sections = buildSections(t);

  async function handleSelect(action: NoteShareAction) {
    if (busyKey) return;

    setBusyKey(action);
    try {
      switch (action) {
        case 'copy':
          await copyNoteContent(source);
          onNotify?.(t('notes.copied'));
          onClose();
          break;
        case 'pdf':
          await downloadNotePdf(source);
          onNotify?.(t('notes.pdfReady'));
          onClose();
          break;
        case 'markdown':
          await downloadNoteMarkdown(source);
          onNotify?.(t('notes.markdownReady'));
          onClose();
          break;
        case 'telegram':
          await shareNoteToTelegram(source);
          onClose();
          break;
        case 'whatsapp':
          await shareNoteToWhatsApp(source);
          onClose();
          break;
        case 'sms':
          await shareNoteViaSms(source);
          onClose();
          break;
        case 'system':
          await shareNoteWithSystemSheet(source);
          onClose();
          break;
        default:
          break;
      }
    } catch {
      onNotify?.(t('notes.shareFailed'));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <BottomSheet visible={visible} title={t('notes.shareTitle')} onClose={onClose}>
      <View style={styles.sections}>
        {sections.map((section, sectionIndex) => (
          <View key={section.id} style={styles.section}>
            <Text
              variant="uiSm"
              color="quiet"
              weight="600"
              style={[
                styles.sectionLabel,
                { textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {section.label}
            </Text>
            <View
              style={[
                styles.group,
                {
                  backgroundColor: colors.canvas,
                  borderColor: colors.border,
                },
              ]}
            >
              {section.options.map((option, optionIndex) => (
                <View key={option.key}>
                  <ShareRow
                    option={option}
                    busy={busyKey === option.key}
                    disabled={Boolean(busyKey)}
                    onPress={() => void handleSelect(option.key)}
                  />
                  {optionIndex < section.options.length - 1 ? (
                    <View
                      style={[styles.divider, { backgroundColor: colors.border }]}
                    />
                  ) : null}
                </View>
              ))}
            </View>
            {sectionIndex < sections.length - 1 ? (
              <View style={styles.sectionGap} />
            ) : null}
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sections: {
    paddingBottom: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    paddingHorizontal: spacing.xs,
    letterSpacing: 0.2,
  },
  sectionGap: {
    height: spacing.md,
  },
  group: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowTitle: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginStart: spacing['4xl'],
  },
});
