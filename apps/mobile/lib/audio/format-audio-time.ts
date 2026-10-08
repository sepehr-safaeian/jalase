import { formatNumber } from '@/lib/format-date';

export function formatAudioClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }

  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor(totalSeconds / 60);

  return `${formatNumber(minutes)}:${formatNumber(seconds, 2)}`;
}

export const PLAYBACK_RATE_LABELS = {
  1: '1x',
  1.5: '1.5x',
  2: '2x',
} as const;

export type PlaybackRate = keyof typeof PLAYBACK_RATE_LABELS;

export const PLAYBACK_RATE_CYCLE: PlaybackRate[] = [1, 1.5, 2];

export function nextPlaybackRate(current: PlaybackRate): PlaybackRate {
  const index = PLAYBACK_RATE_CYCLE.indexOf(current);
  const nextIndex = index < 0 ? 0 : (index + 1) % PLAYBACK_RATE_CYCLE.length;
  return PLAYBACK_RATE_CYCLE[nextIndex];
}
