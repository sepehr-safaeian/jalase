import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MeetingExtractionKind, NoteDetail } from '@jalase/shared';
import { noteHasCompletedRecording } from '@jalase/shared';
import { Text } from '@/components/ui/Text';
import {
  addNoteMember,
  extractMeetingInsight,
  getNote,
  removeNoteMember,
  updateNote,
  updateSpeakerMappings,
} from '@/lib/api/notes.api';
import { formatRelativeMeetingLabel } from '@/lib/format-date';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { layout, spacing, radius } from '@/theme/tokens';
import { typography } from '@/theme/typography';
import { resolveFontFamily } from '@/theme/font-family';
import { MetadataChip } from './MetadataChip';
import { TiptapEditor } from './TiptapEditor';
import { MeetingRecordButton } from './MeetingRecordButton';
import { MeetingInsightFab } from './MeetingInsightFab';
import { MeetingInsightSheet } from './MeetingInsightSheet';
import { NoteRecordingPlayer } from './NoteRecordingPlayer';
import { NoteDateSheet } from './NoteDateSheet';
import { NoteMembersSheet } from './NoteMembersSheet';
import { NoteProjectSheet } from './NoteProjectSheet';
import { NoteShareSheet } from './NoteShareSheet';
import { SubtleToast } from '@/components/ui/SubtleToast';
import { BackButton } from '@/components/ui/BackButton';
import {
  buildDefaultNoteDoc,
  isEmptyNoteContent,
  parseNoteContent,
  serializeNoteContent,
} from '@/lib/notes/note-content';

function resolveNoteContent(note: NoteDetail): string {
  if (note.contentJson?.trim()) {
    return note.contentJson;
  }
  if (note.contentMarkdown?.trim()) {
    return serializeNoteContent(parseNoteContent(note.contentMarkdown));
  }
  return '';
}

interface NoteEditorScreenProps {
  noteId: string;
  isNew?: boolean;
}

export function NoteEditorScreen({ noteId, isNew = false }: NoteEditorScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const rowDirection = isRtl ? 'row-reverse' : 'row';
  const textAlign = isRtl ? 'right' : 'left';
  const writingDirection = isRtl ? 'rtl' : 'ltr';
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth({
    requireProfile: true,
  });

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [insightOpen, setInsightOpen] = useState(false);

  const loadNote = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNote(noteId);
      if (isNew && isEmptyNoteContent(data.contentJson) && !data.contentMarkdown?.trim()) {
        const seeded = await updateNote(noteId, {
          contentJson: serializeNoteContent(
            buildDefaultNoteDoc({
              summary: t('notes.defaultSections.summary'),
              decisions: t('notes.defaultSections.decisions'),
              nextActions: t('notes.defaultSections.nextActions'),
              highlights: t('notes.defaultSections.highlights'),
            }),
          ),
        });
        setNote(seeded);
        return;
      }
      setNote(data);
    } finally {
      setLoading(false);
    }
  }, [isNew, noteId, t]);

  useFocusEffect(
    useCallback(() => {
      void loadNote();
    }, [loadNote]),
  );

  const persist = useCallback(
    async (patch: Parameters<typeof updateNote>[1]) => {
      setSaving(true);
      try {
        const updated = await updateNote(noteId, patch);
        setNote(updated);
      } finally {
        setSaving(false);
      }
    },
    [noteId],
  );

  const debouncedPersist = useDebouncedCallback(
    (patch: Parameters<typeof updateNote>[1]) => {
      void persist(patch);
    },
    700,
  );

  function handleTitleChange(title: string) {
    setNote((prev) => (prev ? { ...prev, title } : prev));
    debouncedPersist({ title });
  }

  function handleContentChange(contentJson: string) {
    setNote((prev) => (prev ? { ...prev, contentJson } : prev));
    debouncedPersist({ contentJson });
  }

  async function handleProjectSelect(projectId: string | null) {
    const updated = await updateNote(noteId, { projectId });
    setNote(updated);
  }

  async function handleAddMember(displayName: string, email: string) {
    const updated = await addNoteMember(noteId, { displayName, email });
    setNote(updated);
  }

  async function handleRemoveMember(memberId: string) {
    const updated = await removeNoteMember(noteId, memberId);
    setNote(updated);
  }

  async function handleSaveSpeakerMappings(
    mappings: Parameters<typeof updateSpeakerMappings>[1]['mappings'],
  ) {
    const updated = await updateSpeakerMappings(noteId, { mappings });
    setNote(updated);
  }

  async function handleExtractInsight(kind: MeetingExtractionKind) {
    const updated = await extractMeetingInsight(noteId, kind);
    setNote(updated);
  }

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/dashboard');
  }, [router]);

  if (authLoading || !isAuthenticated) return null;

  if (loading || !note) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const projectLabel = note.projectName ?? t('notes.projectSheetTitle');
  const membersLabel =
    note.memberCount > 0
      ? t('notes.membersCount', { count: note.memberCount })
      : t('notes.members');
  const speakersCount = note.speakers?.length ?? 0;
  const membersChipLabel =
    speakersCount > 0
      ? t('notes.membersSpeakers', { count: speakersCount })
      : membersLabel;
  const dateLabel = formatRelativeMeetingLabel(note.meetingDate, {
    noDate: t('common.noDate'),
    today: t('common.today'),
  });
  const canRecord = !noteHasCompletedRecording(note);
  const canExtractInsights =
    noteHasCompletedRecording(note) && Boolean(note.transcriptText?.trim());
  const hasRecording = noteHasCompletedRecording(note);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={[styles.topBar, { flexDirection: rowDirection }]}>
          <BackButton onPress={handleBack} />
          {saving ? (
            <Text variant="uiSm" color="muted">
              {t('notes.saving')}
            </Text>
          ) : (
            <Text variant="uiSm" color="quiet">
              {t('notes.autoSave')}
            </Text>
          )}
          <Pressable
            onPress={() => setShareOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('notes.share')}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.72 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <Feather name="share-2" size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBlock}>
            {hasRecording ? (
              <View
                style={[
                  styles.statusBadge,
                  {
                    flexDirection: rowDirection,
                    alignSelf: isRtl ? 'flex-end' : 'flex-start',
                    backgroundColor: colors.primaryTint,
                    borderColor: colors.primaryTint,
                  },
                ]}
              >
                <Feather name="check" size={12} color={colors.primary} />
                <Text variant="uiSm" weight="600" style={{ color: colors.primary }}>
                  {t('notes.recorded')}
                </Text>
              </View>
            ) : null}

            <TextInput
              value={note.title}
              onChangeText={handleTitleChange}
              placeholder={t('notes.titlePlaceholder')}
              placeholderTextColor={colors.textQuiet}
              style={[
                styles.titleInput,
                {
                  textAlign,
                  writingDirection,
                  color: colors.text,
                  fontFamily: resolveFontFamily('700'),
                  fontSize: typography.headingMd.fontSize,
                  lineHeight: typography.headingMd.lineHeight,
                },
              ]}
            />

            <View style={[styles.chips, { flexDirection: rowDirection }]}>
              <MetadataChip
                icon="calendar"
                label={dateLabel}
                onPress={() => setDateOpen(true)}
              />
              <MetadataChip
                icon="users"
                label={membersChipLabel}
                onPress={() => setMembersOpen(true)}
              />
              <MetadataChip
                icon="folder"
                label={projectLabel}
                onPress={() => setProjectOpen(true)}
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.editorBlock}>
            <TiptapEditor
              value={resolveNoteContent(note)}
              onChange={handleContentChange}
              autoFocus={isNew}
            />
          </View>

          {note.recordingAudioUrl ? (
            <NoteRecordingPlayer recordingAudioUrl={note.recordingAudioUrl} />
          ) : null}
        </ScrollView>

        {canRecord ? (
          <MeetingRecordButton
            onPress={() => router.push(`/notes/${noteId}/record`)}
          />
        ) : null}

        {canExtractInsights ? (
          <MeetingInsightFab onPress={() => setInsightOpen(true)} />
        ) : null}
      </KeyboardAvoidingView>

      <NoteDateSheet
        visible={dateOpen}
        createdAt={note.createdAt}
        updatedAt={note.updatedAt}
        meetingDate={note.meetingDate}
        onClose={() => setDateOpen(false)}
      />

      <NoteMembersSheet
        visible={membersOpen}
        members={note.members}
        speakers={note.speakers}
        speakerMappings={note.speakerMappings}
        onClose={() => setMembersOpen(false)}
        onAdd={handleAddMember}
        onRemove={handleRemoveMember}
        onSaveSpeakerMappings={handleSaveSpeakerMappings}
        onNotify={setToastMessage}
      />

      <NoteProjectSheet
        visible={projectOpen}
        selectedProjectId={note.projectId}
        onClose={() => setProjectOpen(false)}
        onSelect={handleProjectSelect}
      />

      <NoteShareSheet
        visible={shareOpen}
        note={note}
        onClose={() => setShareOpen(false)}
        onNotify={setToastMessage}
      />

      <SubtleToast message={toastMessage} onHidden={() => setToastMessage(null)} />

      <MeetingInsightSheet
        visible={insightOpen}
        aiExtractions={note.aiExtractions}
        onClose={() => setInsightOpen(false)}
        onExtract={handleExtractInsight}
        onNotify={setToastMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    zIndex: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 96,
    gap: spacing.xl,
  },
  headerBlock: {
    gap: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  editorBlock: {
    flex: 1,
    minHeight: 280,
  },
  titleInput: {
    padding: 0,
    letterSpacing: typography.headingMd.letterSpacing,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
