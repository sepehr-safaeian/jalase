import { useRef } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useTheme } from '@/theme/ThemeProvider';
import { useMeetingAudioPlayback } from '@/hooks/useMeetingAudioPlayback';
import {
  PLAYBACK_RATE_LABELS,
  formatAudioClock,
} from '@/lib/audio/format-audio-time';
import { radius, spacing } from '@/theme/tokens';

interface MeetingAudioPlayerProps {
  src: string;
}

export function MeetingAudioPlayer({ src }: MeetingAudioPlayerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { direction, textAlign } = useLayoutDirection();
  const trackWidthRef = useRef(0);
  const {
    isPlaying,
    isLoading,
    currentTime,
    duration,
    progress,
    playbackRate,
    error,
    togglePlay,
    seek,
    cyclePlaybackRate,
  } = useMeetingAudioPlayback(src);

  const onTrackLayout = (event: LayoutChangeEvent) => {
    trackWidthRef.current = event.nativeEvent.layout.width;
  };

  const onTrackPress = (event: { nativeEvent: { locationX: number } }) => {
    const width = trackWidthRef.current;
    if (!width) return;
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / width));
    void seek(ratio);
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          direction,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[styles.iconWrap, { backgroundColor: colors.primaryTint }]}
        >
          <Feather name="headphones" size={16} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text variant="body" weight="600" style={{ textAlign }}>
            {t('notes.audioTitle')}
          </Text>
          <Text variant="uiSm" color="quiet" style={{ textAlign }}>
            {error ?? t('notes.audioFile')}
          </Text>
        </View>
        <Text variant="uiSm" color="muted" style={styles.clock}>
          {formatAudioClock(currentTime)} / {formatAudioClock(duration)}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => void togglePlay()}
          disabled={Boolean(error) || isLoading}
          accessibilityRole="button"
          accessibilityLabel={
            isPlaying ? t('notes.audioPause') : t('notes.audioPlay')
          }
          style={({ pressed }) => [
            styles.playButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : error ? 0.45 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primaryText} />
          ) : (
            <Feather
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color={colors.primaryText}
              style={isPlaying ? undefined : styles.playIcon}
            />
          )}
        </Pressable>

        <View style={styles.trackColumn}>
          <Pressable
            onLayout={onTrackLayout}
            onPress={onTrackPress}
            disabled={Boolean(error) || isLoading || !duration}
            accessibilityRole="adjustable"
            accessibilityLabel={t('notes.audioSeek')}
            style={styles.trackHit}
          >
            <View
              style={[styles.track, { backgroundColor: colors.surfaceSoft }]}
            >
              <View
                style={[
                  styles.trackFill,
                  {
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
              <View
                style={[
                  styles.thumb,
                  {
                    left: `${Math.round(progress * 100)}%`,
                    backgroundColor: colors.primary,
                    borderColor: colors.surface,
                  },
                ]}
              />
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={cyclePlaybackRate}
          disabled={Boolean(error) || isLoading}
          accessibilityRole="button"
          accessibilityLabel={t('notes.audioSpeed')}
          style={({ pressed }) => [
            styles.speedButton,
            {
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surfaceSoft : colors.canvas,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Feather name="zap" size={13} color={colors.primary} />
          <Text variant="uiSm" weight="700" style={{ color: colors.primary }}>
            {PLAYBACK_RATE_LABELS[playbackRate]}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  clock: {
    minWidth: 88,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2,
  },
  trackColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  trackHit: {
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  track: {
    height: 4,
    borderRadius: radius.pill,
    overflow: 'visible',
    position: 'relative',
  },
  trackFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.pill,
  },
  thumb: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  footer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  speedButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 34,
  },
});
