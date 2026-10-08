import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TranscriptTurn } from '@jalase/shared';
import { formatTranscriptClock } from '@jalase/shared';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { useLiveTyping } from '@/hooks/useLiveTyping';
import { TRANSCRIPT_HEADING } from '@jalase/shared';

interface LiveTranscriptBlockProps {
  targetText: string;
  turns?: TranscriptTurn[];
  isRecording: boolean;
  isWaiting: boolean;
}

function TurnRow({
  turn,
  isRecording,
}: {
  turn: TranscriptTurn;
  isRecording: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const sourceText =
    isRecording && turn.status === 'draft'
      ? turn.draftText || turn.text
      : turn.text || turn.draftText;

  const { displayText: typed, isTyping } = useLiveTyping(sourceText, {
    enabled: isRecording,
    speed: 140,
  });

  return (
    <View style={styles.turnRow}>
      <Text variant="uiSm" color="quiet" style={styles.turnMeta}>
        [{formatTranscriptClock(turn.startMs)}] {turn.speakerLabel}
        {turn.status === 'draft' && isRecording ? t('notes.draftSuffix') : ''}
      </Text>
      <Text variant="body" style={[styles.turnText, { color: colors.textBody }]}>
        {typed}
        {isTyping ? (
          <Text style={{ color: colors.primary }}>|</Text>
        ) : null}
      </Text>
    </View>
  );
}

export function LiveTranscriptBlock({
  targetText,
  turns = [],
  isRecording,
  isWaiting,
}: LiveTranscriptBlockProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { displayText, isTyping } = useLiveTyping(targetText, {
    enabled: isRecording && turns.length === 0,
    speed: 140,
  });

  if (!isRecording && !isWaiting && !targetText.trim() && turns.length === 0) {
    return null;
  }

  const legacyLines = displayText.split('\n').filter((line) => line.trim());

  return (
    <View
      style={styles.wrap}
      // @ts-expect-error web className
      className="jalase-live-transcript"
    >
      <Text
        variant="headingMd"
        weight="700"
        style={[styles.heading, { color: colors.text }]}
      >
        {TRANSCRIPT_HEADING}
      </Text>

      {isRecording ? (
        <Text variant="body" color="quiet" style={styles.placeholder}>
          {t('notes.recordingInProgress')}
        </Text>
      ) : isWaiting ? (
        <Text variant="body" color="quiet" style={styles.placeholder}>
          {t('notes.transcriptProcessing')}
        </Text>
      ) : turns.length > 0 ? (
        turns.map((turn) => (
          <TurnRow key={turn.id} turn={turn} isRecording={false} />
        ))
      ) : legacyLines.length === 0 ? null : (
        legacyLines.map((line, index) => (
          <Text
            key={`${index}-${line.slice(0, 12)}`}
            variant="body"
            style={[styles.line, { color: colors.textBody }]}
          >
            {line}
          </Text>
        ))
      )}

      {isWaiting && !isRecording ? (
        <View style={styles.cursorRow}>
          <View
            style={[styles.cursor, { backgroundColor: colors.primary }]}
            // @ts-expect-error web className
            className="jalase-live-cursor"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingBottom: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3E3E3',
  },
  heading: {
    textAlign: 'right',
    fontSize: 20,
    lineHeight: 28,
  },
  placeholder: {
    textAlign: 'right',
    fontStyle: 'italic',
  },
  line: {
    textAlign: 'right',
    lineHeight: 28,
    fontSize: 17,
  },
  turnRow: {
    gap: spacing.xs,
  },
  turnMeta: {
    textAlign: 'right',
  },
  turnText: {
    textAlign: 'right',
    lineHeight: 28,
    fontSize: 17,
  },
  cursorRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 28,
  },
  cursor: {
    width: 2,
    height: 20,
    borderRadius: 1,
  },
});
