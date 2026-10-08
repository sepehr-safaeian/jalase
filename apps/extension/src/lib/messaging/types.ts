import type { RecordingStatus } from '@jalase/shared';

export type MessageSource = 'content' | 'popup' | 'offscreen' | 'background';

export interface RecordingStatePayload {
  status: RecordingStatus | 'idle' | 'paused';
  elapsedMs: number;
  noteId: string | null;
  error: string | null;
  isPaused: boolean;
}

export interface SessionPayload {
  isAuthenticated: boolean;
  user: { id: string; phone: string; displayName: string | null } | null;
}

export type BackgroundRequest =
  | { type: 'GET_SESSION' }
  | { type: 'SIGN_IN'; phone: string; code: string }
  | { type: 'SEND_OTP'; phone: string }
  | { type: 'SIGN_OUT' }
  | { type: 'GET_RECORDING_STATE' }
  | {
      type: 'START_RECORDING';
      tabId?: number;
      meetingTitle: string;
      platform: string;
    }
  | { type: 'PAUSE_RECORDING' }
  | { type: 'RESUME_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'CANCEL_RECORDING' }
  | { type: 'REQUEST_AUTH_POPUP' };

export type BackgroundResponse =
  | { ok: true; session?: SessionPayload; devCode?: string }
  | { ok: true; recordingState?: RecordingStatePayload }
  | { ok: true; noteId?: string }
  | { ok: false; error: string };

export type OffscreenRequest =
  | {
      type: 'OFFSCREEN_START';
      streamId: string;
      noteId: string;
      tabId: number;
    }
  | { type: 'OFFSCREEN_PAUSE' }
  | { type: 'OFFSCREEN_RESUME' }
  | { type: 'OFFSCREEN_STOP' }
  | { type: 'OFFSCREEN_CANCEL' };

export type OffscreenResponse =
  | { ok: true; elapsedMs?: number }
  | {
      ok: true;
      audioBuffer: ArrayBuffer;
      mimeType: string;
      elapsedMs: number;
    }
  | { ok: false; error: string };

export type BackgroundBroadcast =
  | { type: 'RECORDING_STATE_CHANGED'; state: RecordingStatePayload }
  | {
      type: 'RECORDING_COMPLETE';
      noteId: string;
      title: string;
    }
  | { type: 'RECORDING_ERROR'; error: string };

/** Resolved at runtime via WXT manifest */
export const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';
