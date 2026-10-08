import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { noteHasCompletedRecording } from '@jalase/shared';
import { Text } from '@/components/ui/Text';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useMeetingRecorder } from '@/hooks/useMeetingRecorder';
import { getNote } from '@/lib/api/notes.api';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { AudioFrequencyVisualizer } from './AudioFrequencyVisualizer';
import { formatRecordingTime } from './format-recording-time';

interface MeetingRecorderScreenProps {
  noteId: string;
  isNew?: boolean;
}

export function MeetingRecorderScreen({ noteId, isNew = false }: MeetingRecorderScreenProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const rowDirection = isRtl ? 'row-reverse' : 'row';
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth({
    requireProfile: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [gateLoading, setGateLoading] = useState(true);
  const autoStartedRef = useRef(false);

  const navigateToNote = useCallback(() => {
    router.replace(isNew ? `/notes/${noteId}?new=1` : `/notes/${noteId}`);
  }, [isNew, noteId, router]);

  const {
    elapsedMs,
    mediaStream,
    isPaused,
    isRecording,
    isProcessing,
    start,
    togglePause,
    stop,
    cancel,
  } = useMeetingRecorder({
    noteId,
    onStop: () => {
      navigateToNote();
    },
    onError: (message) => setError(message),
  });

  useEffect(() => {
    let cancelled = false;
    void getNote(noteId)
      .then((note) => {
        if (cancelled) return;
        if (noteHasCompletedRecording(note)) {
          navigateToNote();
          return;
        }
        setGateLoading(false);
      })
      .catch(() => {
        if (!cancelled) setGateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigateToNote, noteId]);

  useEffect(() => {
    if (gateLoading || autoStartedRef.current || isProcessing) return;
    autoStartedRef.current = true;
    void start();
  }, [gateLoading, isProcessing, start]);

  const handleClose = useCallback(() => {
    if (isProcessing) return;

    const goBack = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(isNew ? `/notes/${noteId}?new=1` : `/notes/${noteId}`);
      }
    };

    if (!isRecording) {
      goBack();
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(t('recorder.cancelMessage'));
      if (confirmed) {
        void cancel().finally(goBack);
      }
      return;
    }

    Alert.alert(t('recorder.cancelTitle'), t('recorder.cancelMessage'), [
      { text: t('recorder.continueRecording'), style: 'cancel' },
      {
        text: t('recorder.cancelTitle'),
        style: 'destructive',
        onPress: () => {
          void cancel().finally(goBack);
        },
      },
    ]);
  }, [cancel, isProcessing, isRecording, isNew, noteId, router, t]);

  if (authLoading || !isAuthenticated || gateLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const visualizerActive = isRecording && !isPaused && !isProcessing;
  const timerLabel = isProcessing
    ? t('recorder.transcribing')
    : formatRecordingTime(elapsedMs);

  const statusHint = isProcessing
    ? t('recorder.hintProcessing')
    : isPaused
      ? t('recorder.hintPaused')
      : isRecording
        ? t('recorder.hintListening')
        : t('recorder.hintReady');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel={t('recorder.close')}
          hitSlop={12}
          style={({ pressed }) => [
            styles.iconButton,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              opacity: isProcessing ? 0.45 : pressed ? 0.88 : 1,
              transform: [{ scale: pressed && !isProcessing ? 0.97 : 1 }],
            },
          ]}
        >
          <Feather name="x" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.visualBlock}>
          <AudioFrequencyVisualizer
            stream={mediaStream}
            isActive={visualizerActive}
            size={300}
          />
          <View style={styles.brandOverlay} pointerEvents="none">
            <Text variant="headingSm" weight="700" style={styles.brandTitle}>
              {t('recorder.brandName')}
            </Text>
            <Text variant="uiSm" color="muted" style={styles.brandTagline}>
              {t('recorder.brandTagline')}
            </Text>
          </View>
        </View>

        <View style={styles.statusBlock}>
          <Text
            variant="headingSm"
            weight="600"
            style={[styles.timer, { color: colors.text }]}
          >
            {timerLabel}
          </Text>
          <Text variant="body" color="muted" style={styles.hint}>
            {statusHint}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {error ? (
          <Text variant="uiSm" color="error" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <View style={[styles.controls, { flexDirection: rowDirection }]}>
          <Pressable
            onPress={togglePause}
            disabled={!isRecording || isProcessing}
            accessibilityRole="button"
            accessibilityLabel={
              isPaused ? t('recorder.resumeRecording') : t('recorder.pauseRecording')
            }
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                flexDirection: rowDirection,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: !isRecording || isProcessing ? 0.45 : pressed ? 0.88 : 1,
                transform: [{ scale: pressed && isRecording ? 0.97 : 1 }],
              },
            ]}
          >
            <Feather
              name={isPaused ? 'play' : 'pause'}
              size={18}
              color={colors.text}
            />
            <Text variant="uiSm" weight="600">
              {isPaused ? t('recorder.resume') : t('recorder.pause')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void stop()}
            disabled={!isRecording || isProcessing}
            accessibilityRole="button"
            accessibilityLabel={t('recorder.stopRecording')}
            style={({ pressed }) => [
              styles.stopButton,
              {
                flexDirection: rowDirection,
                backgroundColor: colors.primary,
                opacity: !isRecording || isProcessing ? 0.45 : pressed ? 0.92 : 1,
                transform: [{ scale: pressed && isRecording ? 0.97 : 1 }],
              },
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <>
                <View
                  style={[styles.stopSquare, { backgroundColor: colors.primaryText }]}
                />
                <Text variant="ui" weight="600" style={{ color: colors.primaryText }}>
                  {t('recorder.stopRecording')}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    alignItems: 'flex-start',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  visualBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brandOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  brandTitle: {
    letterSpacing: 0.5,
  },
  brandTagline: {
    textAlign: 'center',
  },
  statusBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.base,
  },
  timer: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  hint: {
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  error: {
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 112,
    justifyContent: 'center',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minWidth: 148,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  stopSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
});
