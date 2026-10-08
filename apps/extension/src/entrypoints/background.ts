import { isFeatureEnabled, normalizeTier } from '@jalase/shared';
import { sendOtp, verifyOtp } from '@/lib/api/auth.api';
import { createNote } from '@/lib/api/notes.api';
import {
  finalizeRecording,
  startRecording,
  stopRecording,
} from '@/lib/api/transcription.api';
import { getFeatureFlagsMe } from '@/lib/api/feature-flags.api';
import { ApiError } from '@/lib/api/client';
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  setAccessToken,
  setStoredUser,
} from '@/lib/auth/storage';
import type {
  BackgroundBroadcast,
  BackgroundRequest,
  BackgroundResponse,
  OffscreenRequest,
  RecordingStatePayload,
  SessionPayload,
} from '@/lib/messaging/types';
import type { OffscreenResponse } from '@/lib/messaging/types';
import { OFFSCREEN_DOCUMENT_PATH } from '@/lib/messaging/types';

const GOOSHA_APP_URL =
  import.meta.env.WXT_APP_URL ??
  import.meta.env.WXT_GOOSHA_APP_URL ??
  'http://localhost:8081';

let recordingState: RecordingStatePayload = {
  status: 'idle',
  elapsedMs: 0,
  noteId: null,
  error: null,
  isPaused: false,
};

let activeTabId: number | null = null;
let activeNoteTitle = '';
let elapsedTimer: ReturnType<typeof setInterval> | null = null;
let offscreenReady = false;

function broadcast(message: BackgroundBroadcast) {
  void browser.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        void browser.tabs.sendMessage(tab.id, message).catch(() => undefined);
      }
    }
  });
}

function updateRecordingState(patch: Partial<RecordingStatePayload>) {
  recordingState = { ...recordingState, ...patch };
  broadcast({ type: 'RECORDING_STATE_CHANGED', state: recordingState });
}

function clearElapsedTimer() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer);
    elapsedTimer = null;
  }
}

function startElapsedTimer() {
  clearElapsedTimer();
  elapsedTimer = setInterval(() => {
    if (recordingState.status === 'recording' && !recordingState.isPaused) {
      updateRecordingState({ elapsedMs: recordingState.elapsedMs + 1000 });
    }
  }, 1000);
}

async function getSession(): Promise<SessionPayload> {
  const token = await getAccessToken();
  const user = await getStoredUser();
  return {
    isAuthenticated: Boolean(token && user),
    user,
  };
}

async function ensureOffscreenDocument(): Promise<void> {
  if (offscreenReady) return;

  const existing = await chrome.offscreen.hasDocument?.();
  if (existing) {
    offscreenReady = true;
    return;
  }

  const offscreenUrl = browser.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);

  await chrome.offscreen.createDocument({
    url: offscreenUrl,
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: 'Recording meeting tab audio for Goosha transcription',
  });

  offscreenReady = true;
}

async function sendToOffscreen(
  message: OffscreenRequest,
): Promise<OffscreenResponse> {
  await ensureOffscreenDocument();
  const response = (await browser.runtime.sendMessage(message)) as OffscreenResponse;
  return response;
}

async function getTabCaptureStreamId(tabId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      if (chrome.runtime.lastError || !streamId) {
        reject(new Error(chrome.runtime.lastError?.message ?? 'tabCapture failed'));
        return;
      }
      resolve(streamId);
    });
  });
}

async function checkRecordingPermissions(token: string): Promise<string | null> {
  const flags = await getFeatureFlagsMe(token);
  const tier = normalizeTier(flags.tier);
  const dev = import.meta.env.DEV;

  if (!isFeatureEnabled('meeting.connect', { tier, isDev: dev })) {
    return 'اتصال به جلسه آنلاین نیاز به اشتراک Plus دارد.';
  }
  if (!isFeatureEnabled('meeting.record', { tier, isDev: dev })) {
    return 'ضبط جلسه نیاز به اشتراک Plus دارد.';
  }
  if (!flags.enabled.includes('meeting.connect')) {
    return 'اتصال به Google Meet برای حساب شما فعال نیست.';
  }
  return null;
}

async function handleStartRecording(
  tabId: number,
  meetingTitle: string,
): Promise<BackgroundResponse> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: 'لطفاً ابتدا وارد Goosha شوید.' };
  }

  const permissionError = await checkRecordingPermissions(token);
  if (permissionError) {
    return { ok: false, error: permissionError };
  }

  if (recordingState.status === 'recording' || recordingState.status === 'processing') {
    return { ok: false, error: 'یک ضبط دیگر در حال انجام است.' };
  }

  try {
    const note = await createNote(token, {
      title: meetingTitle || 'جلسه آنلاین',
      meetingDate: new Date().toISOString(),
    });

    await startRecording(token, note.id);

    const streamId = await getTabCaptureStreamId(tabId);
    const offscreenResult = await sendToOffscreen({
      type: 'OFFSCREEN_START',
      streamId,
      noteId: note.id,
      tabId,
    });

    if (!offscreenResult.ok) {
      await stopRecording(token, note.id).catch(() => undefined);
      return { ok: false, error: offscreenResult.error };
    }

    activeTabId = tabId;
    activeNoteTitle = note.title;
    updateRecordingState({
      status: 'recording',
      noteId: note.id,
      elapsedMs: 0,
      error: null,
      isPaused: false,
    });
    startElapsedTimer();

    return { ok: true, noteId: note.id };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'شروع ضبط ناموفق بود.';
    return { ok: false, error: message };
  }
}

async function handleStopRecording(): Promise<BackgroundResponse> {
  const token = await getAccessToken();
  const noteId = recordingState.noteId;

  if (!token || !noteId) {
    return { ok: false, error: 'ضبط فعالی وجود ندارد.' };
  }

  updateRecordingState({ status: 'processing', isPaused: false });
  clearElapsedTimer();

  try {
    const offscreenResult = await sendToOffscreen({ type: 'OFFSCREEN_STOP' });

    if (!offscreenResult.ok || !('audioBuffer' in offscreenResult)) {
      updateRecordingState({ status: 'idle', noteId: null, error: offscreenResult.error });
      return { ok: false, error: offscreenResult.error ?? 'ضبط ناموفق بود.' };
    }

    const blob = new Blob([offscreenResult.audioBuffer], {
      type: offscreenResult.mimeType,
    });

    await finalizeRecording(token, noteId, blob);

    const title = activeNoteTitle;
    activeTabId = null;
    activeNoteTitle = '';

    updateRecordingState({
      status: 'idle',
      noteId: null,
      elapsedMs: 0,
      error: null,
      isPaused: false,
    });

    await showCompletionNotification(noteId, title);
    broadcast({ type: 'RECORDING_COMPLETE', noteId, title });

    return { ok: true, noteId };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'رونویسی ناموفق بود.';
    updateRecordingState({ status: 'idle', noteId: null, error: message });
    broadcast({ type: 'RECORDING_ERROR', error: message });
    return { ok: false, error: message };
  }
}

async function handleCancelRecording(): Promise<BackgroundResponse> {
  const token = await getAccessToken();
  const noteId = recordingState.noteId;

  clearElapsedTimer();
  await sendToOffscreen({ type: 'OFFSCREEN_CANCEL' });

  if (token && noteId) {
    await stopRecording(token, noteId).catch(() => undefined);
  }

  activeTabId = null;
  activeNoteTitle = '';
  updateRecordingState({
    status: 'idle',
    noteId: null,
    elapsedMs: 0,
    error: null,
    isPaused: false,
  });

  return { ok: true };
}

async function showCompletionNotification(noteId: string, title: string) {
  const deepLink = `${GOOSHA_APP_URL}/notes/${noteId}`;

  await browser.notifications.create(`goosha-complete-${noteId}`, {
    type: 'basic',
    iconUrl: browser.runtime.getURL('/icon/icon.svg'),
    title: 'گوشا: یادداشت آماده است',
    message: title,
    priority: 2,
  });

  await browser.storage.local.set({
    [`goosha_last_note_${noteId}`]: { title, deepLink, at: Date.now() },
  });
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: BackgroundRequest | OffscreenRequest, sender, sendResponse) => {
      if (
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        typeof message.type === 'string' &&
        message.type.startsWith('OFFSCREEN_')
      ) {
        return false;
      }

      void (async (): Promise<void> => {
        let response: BackgroundResponse;

        try {
          switch (message.type) {
            case 'GET_SESSION': {
              const session = await getSession();
              response = { ok: true, session };
              break;
            }
            case 'SEND_OTP': {
              const result = await sendOtp(message.phone);
              response = { ok: true, devCode: result.devCode };
              break;
            }
            case 'SIGN_IN': {
              const result = await verifyOtp(message.phone, message.code);
              await setAccessToken(result.accessToken);
              await setStoredUser({
                id: result.user.id,
                phone: result.user.phone,
                displayName: result.user.displayName,
              });
              response = { ok: true, session: await getSession() };
              break;
            }
            case 'SIGN_OUT': {
              await clearSession();
              response = { ok: true, session: await getSession() };
              break;
            }
            case 'GET_RECORDING_STATE': {
              response = { ok: true, recordingState };
              break;
            }
            case 'START_RECORDING': {
              const tabId =
                message.tabId ?? sender.tab?.id;
              if (!tabId) {
                response = { ok: false, error: 'تب جلسه یافت نشد.' };
                break;
              }
              response = await handleStartRecording(
                tabId,
                message.meetingTitle,
              );
              break;
            }
            case 'PAUSE_RECORDING': {
              const pauseResult = await sendToOffscreen({ type: 'OFFSCREEN_PAUSE' });
              if (pauseResult.ok) {
                updateRecordingState({ isPaused: true });
                response = { ok: true };
              } else {
                response = { ok: false, error: pauseResult.error };
              }
              break;
            }
            case 'RESUME_RECORDING': {
              const resumeResult = await sendToOffscreen({ type: 'OFFSCREEN_RESUME' });
              if (resumeResult.ok) {
                updateRecordingState({ isPaused: false });
                response = { ok: true };
              } else {
                response = { ok: false, error: resumeResult.error };
              }
              break;
            }
            case 'STOP_RECORDING': {
              response = await handleStopRecording();
              break;
            }
            case 'CANCEL_RECORDING': {
              response = await handleCancelRecording();
              break;
            }
            case 'REQUEST_AUTH_POPUP': {
              try {
                await browser.action.openPopup();
              } catch {
                /* popup may fail if no user gesture */
              }
              response = { ok: true };
              break;
            }
            default:
              response = { ok: false, error: 'پیام ناشناخته' };
          }
        } catch (err) {
          response = {
            ok: false,
            error: err instanceof Error ? err.message : 'خطای ناشناخته',
          };
        }

        sendResponse(response);
      })();

      return true;
    },
  );

  browser.notifications.onClicked.addListener((notificationId) => {
    const match = notificationId.match(/^goosha-complete-(.+)$/);
    if (match?.[1]) {
      const noteId = match[1];
      const url = `${GOOSHA_APP_URL}/notes/${noteId}`;
      void browser.tabs.create({ url });
    }
  });
});
