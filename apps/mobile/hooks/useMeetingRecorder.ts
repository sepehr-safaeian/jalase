import { useCallback, useState } from 'react';
import type { RecordingStatus, StopRecordingResponse } from '@jalase/shared';

interface UseMeetingRecorderOptions {
  noteId: string;
  onStop?: (result: StopRecordingResponse) => void;
  onError?: (message: string) => void;
}

/** Native: ضبط زنده فعلاً فقط روی وب پشتیبانی می‌شود. */
export function useMeetingRecorder({ onError }: UseMeetingRecorderOptions) {
  const [status] = useState<RecordingStatus>('idle');

  const notifyWebOnly = useCallback(async () => {
    onError?.('ضبط زنده جلسه فعلاً فقط در نسخه وب در دسترس است');
  }, [onError]);

  return {
    status,
    elapsedMs: 0,
    pendingChunks: 0,
    mediaStream: null,
    isPaused: false,
    isRecording: false,
    isProcessing: false,
    start: notifyWebOnly,
    pause: async () => undefined,
    resume: async () => undefined,
    togglePause: notifyWebOnly,
    toggle: notifyWebOnly,
    stop: async () => undefined,
    cancel: async () => undefined,
  };
}
