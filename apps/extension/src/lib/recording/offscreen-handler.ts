import { pickMimeType } from '@/lib/recording/pick-mime-type';
import type {
  OffscreenRequest,
  OffscreenResponse,
} from '@/lib/messaging/types';

let recorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;
let parts: Blob[] = [];
let mimeType = 'audio/webm';
let elapsedMs = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let isPaused = false;
let activeNoteId: string | null = null;

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function startTimer() {
  clearTimer();
  timer = setInterval(() => {
    if (!isPaused) elapsedMs += 1000;
  }, 1000);
}

async function getTabAudioStream(streamId: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    } as MediaTrackConstraints,
    video: false,
  });
}

async function stopTracks() {
  clearTimer();
  if (recorder && recorder.state !== 'inactive') {
    try {
      recorder.stop();
    } catch {
      /* ignore */
    }
  }
  recorder = null;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
}

async function startRecording(
  streamId: string,
  noteId: string,
): Promise<OffscreenResponse> {
  await stopTracks();

  activeNoteId = noteId;
  parts = [];
  elapsedMs = 0;
  isPaused = false;
  mimeType = pickMimeType();

  try {
    stream = await getTabAudioStream(streamId);
  } catch {
    return { ok: false, error: 'دسترسی به صدای تب Meet ممکن نشد.' };
  }

  recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) parts.push(event.data);
  };

  recorder.start(1000);
  startTimer();

  return { ok: true, elapsedMs };
}

function pauseRecording(): OffscreenResponse {
  if (!recorder || recorder.state !== 'recording') {
    return { ok: false, error: 'ضبط فعال نیست.' };
  }
  recorder.pause();
  isPaused = true;
  return { ok: true, elapsedMs };
}

function resumeRecording(): OffscreenResponse {
  if (!recorder || recorder.state !== 'paused') {
    return { ok: false, error: 'ضبط در حالت مکث نیست.' };
  }
  recorder.resume();
  isPaused = false;
  return { ok: true, elapsedMs };
}

async function finalizeRecording(): Promise<OffscreenResponse> {
  if (!recorder || !activeNoteId) {
    return { ok: false, error: 'ضبط فعالی وجود ندارد.' };
  }

  const currentRecorder = recorder;
  const currentParts = parts;
  const currentMime = mimeType;
  const currentElapsed = elapsedMs;

  await new Promise<void>((resolve) => {
    currentRecorder.addEventListener('stop', () => resolve(), { once: true });
    if (currentRecorder.state !== 'inactive') {
      currentRecorder.stop();
    } else {
      resolve();
    }
  });

  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  recorder = null;
  clearTimer();

  const blob = new Blob(currentParts, { type: currentMime });
  if (blob.size < 2048) {
    activeNoteId = null;
    parts = [];
    return { ok: false, error: 'صدای کافی برای رونویسی ضبط نشد.' };
  }

  const buffer = await blob.arrayBuffer();
  activeNoteId = null;
  parts = [];

  return {
    ok: true,
    audioBuffer: buffer,
    mimeType: currentMime,
    elapsedMs: currentElapsed,
  };
}

async function cancelRecording(): Promise<OffscreenResponse> {
  await stopTracks();
  parts = [];
  activeNoteId = null;
  elapsedMs = 0;
  isPaused = false;
  return { ok: true };
}

export function registerOffscreenHandlers() {
  browser.runtime.onMessage.addListener(
    (message: OffscreenRequest, _sender, sendResponse) => {
      if (
        typeof message !== 'object' ||
        message === null ||
        !('type' in message) ||
        typeof message.type !== 'string' ||
        !message.type.startsWith('OFFSCREEN_')
      ) {
        return false;
      }

      void (async () => {
        let response: OffscreenResponse;

        switch (message.type) {
          case 'OFFSCREEN_START':
            response = await startRecording(message.streamId, message.noteId);
            break;
          case 'OFFSCREEN_PAUSE':
            response = pauseRecording();
            break;
          case 'OFFSCREEN_RESUME':
            response = resumeRecording();
            break;
          case 'OFFSCREEN_STOP':
            response = await finalizeRecording();
            break;
          case 'OFFSCREEN_CANCEL':
            response = await cancelRecording();
            break;
          default:
            response = { ok: false, error: 'پیام ناشناخته' };
        }

        sendResponse(response);
      })();

      return true;
    },
  );
}
