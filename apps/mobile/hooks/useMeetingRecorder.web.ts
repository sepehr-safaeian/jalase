import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  RecordingStatus,
  StopRecordingResponse,
} from '@jalase/shared';
import {
  startRecording,
  finalizeRecording,
  getRecordingStatus,
  stopRecording,
} from '@/lib/api/transcription.api';
import { ApiError } from '@/lib/api/client';

const MIN_AUDIO_BYTES = 2048;
const FINALIZE_TIMEOUT_MS = 600_000;

interface UseMeetingRecorderOptions {
  noteId: string;
  onStop?: (result: StopRecordingResponse) => void;
  onError?: (message: string) => void;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? 'audio/webm';
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function useMeetingRecorder({
  noteId,
  onStop,
  onError,
}: UseMeetingRecorderOptions) {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const partsRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef('audio/webm');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const statusRef = useRef<RecordingStatus>('idle');
  statusRef.current = status;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reportError = useCallback(
    (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'خطا در ضبط جلسه';
      onError?.(message);
    },
    [onError],
  );

  const stopTracks = useCallback(() => {
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMediaStream(null);
  }, []);

  const stopRecorderTracks = useCallback(async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder || recorder.state === 'inactive') {
      stopTracks();
      return;
    }

    await new Promise<void>((resolve) => {
      const handleStop = () => {
        recorder.removeEventListener('stop', handleStop);
        resolve();
      };
      recorder.addEventListener('stop', handleStop);
      recorder.stop();
    });
    stopTracks();
  }, [stopTracks]);

  const cancel = useCallback(async () => {
    if (statusRef.current === 'processing') return;

    clearTimer();
    isPausedRef.current = false;
    setIsPaused(false);
    await stopRecorderTracks();
    partsRef.current = [];
    setElapsedMs(0);
    setStatus('idle');
    sessionActiveRef.current = false;

    try {
      await stopRecording(noteId);
    } catch {
      // ignore cleanup errors
    }
  }, [clearTimer, noteId, stopRecorderTracks]);

  const stop = useCallback(async () => {
    clearTimer();
    isPausedRef.current = false;
    setIsPaused(false);

    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      stopTracks();
      setStatus('idle');
      return;
    }

    if (recorder.state === 'paused') {
      recorder.resume();
    }

    setStatus('processing');

    const audioBlob = await new Promise<Blob | null>((resolve) => {
      const handleStop = () => {
        recorder.removeEventListener('stop', handleStop);
        if (!partsRef.current.length) {
          resolve(null);
          return;
        }
        resolve(new Blob(partsRef.current, { type: mimeTypeRef.current }));
      };

      recorder.addEventListener('stop', handleStop);
      recorder.stop();
    });

    stopTracks();

    if (!audioBlob || audioBlob.size < MIN_AUDIO_BYTES) {
      try {
        await stopRecording(noteId);
      } catch {
        // ignore cancel cleanup errors
      }
      setStatus('idle');
      onError?.('صدایی ضبط نشد');
      return;
    }

    try {
      const result = await withTimeout(
        finalizeRecording(noteId, audioBlob, mimeTypeRef.current),
        FINALIZE_TIMEOUT_MS,
        'رونویسی جلسه بیش از حد طول کشید',
      );
      onStop?.(result);
    } catch (err) {
      reportError(err);
    } finally {
      partsRef.current = [];
      setStatus('idle');
      sessionActiveRef.current = false;
    }
  }, [clearTimer, noteId, onError, onStop, reportError, stopTracks]);

  const start = useCallback(async () => {
    if (statusRef.current === 'recording' || statusRef.current === 'processing') {
      return;
    }

    try {
      await startRecording(noteId);
    } catch (err) {
      reportError(err);
      return;
    }

    partsRef.current = [];
    setElapsedMs(0);
    isPausedRef.current = false;
    setIsPaused(false);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000,
      },
    });

    streamRef.current = stream;
    setMediaStream(stream);
    mimeTypeRef.current = pickMimeType();

    const recorder = new MediaRecorder(stream, { mimeType: mimeTypeRef.current });
    recorderRef.current = recorder;

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        partsRef.current.push(event.data);
      }
    });

    recorder.start(1000);
    setStatus('recording');
    sessionActiveRef.current = true;

    timerRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        setElapsedMs((prev) => prev + 1000);
      }
    }, 1000);
  }, [noteId, reportError]);

  const cancelRef = useRef(cancel);
  cancelRef.current = cancel;

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.pause();
    isPausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    recorder.resume();
    isPausedRef.current = false;
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
      return;
    }
    pause();
  }, [isPaused, pause, resume]);

  const toggle = useCallback(async () => {
    if (status === 'recording') {
      await stop();
      return;
    }
    if (status === 'idle') {
      await start();
    }
  }, [start, status, stop]);

  useEffect(() => {
    let cancelled = false;

    void getRecordingStatus(noteId)
      .then((recordingStatus) => {
        if (cancelled || recordingStatus.status !== 'recording') {
          return;
        }

        const startedAt = recordingStatus.recordingStartedAt
          ? Date.parse(recordingStatus.recordingStartedAt)
          : 0;
        const stale = !startedAt || Date.now() - startedAt > 30 * 60 * 1000;

        if (stale) {
          void stopRecording(noteId).catch(() => undefined);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [noteId]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (sessionActiveRef.current) {
        void cancelRef.current();
      } else {
        stopTracks();
      }
    };
  }, [noteId, clearTimer, stopTracks]);

  return {
    status,
    elapsedMs,
    pendingChunks: 0,
    mediaStream,
    isPaused,
    isRecording: status === 'recording',
    isProcessing: status === 'processing',
    start,
    pause,
    resume,
    togglePause,
    toggle,
    stop,
    cancel,
  };
}
