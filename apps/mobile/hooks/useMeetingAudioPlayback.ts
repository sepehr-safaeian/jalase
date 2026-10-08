import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import {
  nextPlaybackRate,
  type PlaybackRate,
} from '@/lib/audio/format-audio-time';

export interface MeetingAudioPlayback {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  playbackRate: PlaybackRate;
  error: string | null;
  togglePlay: () => void;
  seek: (ratio: number) => void;
  cyclePlaybackRate: () => void;
}

function statusToSeconds(millis: number | undefined): number {
  return typeof millis === 'number' && Number.isFinite(millis)
    ? millis / 1000
    : 0;
}

export function useMeetingAudioPlayback(src: string): MeetingAudioPlayback {
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1);
  const [error, setError] = useState<string | null>(null);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setError('پخش فایل صوتی ممکن نیست');
        setIsLoading(false);
      }
      return;
    }

    durationRef.current = statusToSeconds(status.durationMillis);
    setDuration(durationRef.current);
    setCurrentTime(statusToSeconds(status.positionMillis));
    setIsPlaying(status.isPlaying);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    void (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: src },
          { shouldPlay: false, rate: playbackRate, shouldCorrectPitch: true },
          onPlaybackStatusUpdate,
        );

        if (!active) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
      } catch {
        if (active) {
          setError('پخش فایل صوتی ممکن نیست');
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) {
        void sound.unloadAsync();
      }
    };
  }, [onPlaybackStatusUpdate, src]);

  useEffect(() => {
    const sound = soundRef.current;
    if (!sound) return;

    void sound.setRateAsync(playbackRate, true);
  }, [playbackRate]);

  const togglePlay = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound || error) return;

    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await sound.pauseAsync();
      return;
    }

    await sound.playAsync();
  }, [error]);

  const seek = useCallback(async (ratio: number) => {
    const sound = soundRef.current;
    const total = durationRef.current;
    if (!sound || !total) return;

    const positionMillis = Math.max(0, Math.min(total, ratio * total)) * 1000;
    await sound.setPositionAsync(positionMillis);
    setCurrentTime(positionMillis / 1000);
  }, []);

  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRate((current) => nextPlaybackRate(current));
  }, []);

  const progress = duration > 0 ? currentTime / duration : 0;

  return {
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
  };
}
