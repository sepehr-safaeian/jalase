import { useCallback, useEffect, useRef, useState } from 'react';
import { ConsentModal } from '@/ui/ConsentModal';
import { RecorderOverlay } from '@/ui/RecorderOverlay';
import { SuccessToast } from '@/ui/SuccessToast';
import { mountShadowUi } from '@/ui/mount-shadow';
import { sendToBackground, onBackgroundBroadcast } from '@/lib/messaging/send';
import type { RecordingStatePayload } from '@/lib/messaging/types';
import { t } from '@/lib/i18n/ui-strings';
import {
  getGoogleMeetTitle,
  isGoogleMeetInActiveCall,
  onGoogleMeetCallStateChange,
} from '@/platforms/google-meet';

const CONSENT_DISMISSED_PREFIX = 'goosha_consent_dismissed';
const GOOSHA_APP_URL =
  import.meta.env.WXT_APP_URL ??
  import.meta.env.WXT_GOOSHA_APP_URL ??
  'http://localhost:8081';

type UiPhase = 'hidden' | 'consent' | 'recorder' | 'success';

function getConsentDismissedKey() {
  return `${CONSENT_DISMISSED_PREFIX}:${location.pathname}`;
}

function MeetApp() {
  const [phase, setPhase] = useState<UiPhase>('hidden');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [meetingTitle, setMeetingTitle] = useState<string | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingStatePayload>({
    status: 'idle',
    elapsedMs: 0,
    noteId: null,
    error: null,
    isPaused: false,
  });
  const [successNote, setSuccessNote] = useState<{ id: string; title: string } | null>(null);
  const [previewStream] = useState<MediaStream | null>(null);

  const showConsentIfNeeded = useCallback(() => {
    if (!isGoogleMeetInActiveCall()) {
      setPhase('hidden');
      return;
    }

    const dismissed = sessionStorage.getItem(getConsentDismissedKey());
    if (dismissed === 'true') return;

    setMeetingTitle(getGoogleMeetTitle());
    setPhase('consent');
  }, []);

  useEffect(() => {
    showConsentIfNeeded();
    return onGoogleMeetCallStateChange((inCall) => {
      if (inCall) {
        showConsentIfNeeded();
      } else if (phaseRef.current !== 'recorder') {
        setPhase('hidden');
      }
    });
  }, [showConsentIfNeeded]);

  useEffect(() => {
    return onBackgroundBroadcast((message) => {
      if (
        typeof message === 'object' &&
        message !== null &&
        'type' in message
      ) {
        const typed = message as { type: string };
        if (typed.type === 'RECORDING_STATE_CHANGED') {
          const payload = message as { state: RecordingStatePayload };
          setRecordingState(payload.state);
          if (payload.state.status === 'recording' || payload.state.status === 'processing') {
            setPhase('recorder');
          }
        }
        if (typed.type === 'RECORDING_COMPLETE') {
          const payload = message as { noteId: string; title: string };
          setSuccessNote({ id: payload.noteId, title: payload.title });
          setPhase('success');
        }
        if (typed.type === 'RECORDING_ERROR') {
          const payload = message as { error: string };
          setConsentError(payload.error);
        }
      }
    });
  }, []);

  useEffect(() => {
    void sendToBackground({ type: 'GET_RECORDING_STATE' }, { retries: 3 }).then(
      (result) => {
        if (!result.ok || !result.recordingState) return;

        setRecordingState(result.recordingState);
        if (
          result.recordingState.status === 'recording' ||
          result.recordingState.status === 'processing'
        ) {
          setPhase('recorder');
        }
      },
    );
  }, []);

  async function handleAcceptConsent() {
    setConsentLoading(true);
    setConsentError(null);

    const session = await sendToBackground({ type: 'GET_SESSION' });
    if (!session.ok || !session.session?.isAuthenticated) {
      setConsentError(t('signInFirst'));
      setConsentLoading(false);
      void sendToBackground({ type: 'REQUEST_AUTH_POPUP' });
      return;
    }

    const response = await sendToBackground({
      type: 'START_RECORDING',
      meetingTitle: getGoogleMeetTitle() ?? t('defaultMeetTitle'),
      platform: 'google_meet',
    });

    setConsentLoading(false);

    if (!response.ok) {
      setConsentError(response.error);
      return;
    }

    setPhase('recorder');
  }

  function handleDeclineConsent() {
    sessionStorage.setItem(getConsentDismissedKey(), 'true');
    setPhase('hidden');
  }

  async function handleStop() {
    await sendToBackground({ type: 'STOP_RECORDING' });
  }

  async function handlePause() {
    await sendToBackground({ type: 'PAUSE_RECORDING' });
  }

  async function handleResume() {
    await sendToBackground({ type: 'RESUME_RECORDING' });
  }

  async function handleCancel() {
    if (recordingState.status === 'recording') {
      const confirmed = window.confirm(t('cancelRecordingConfirm'));
      if (!confirmed) return;
    }
    await sendToBackground({ type: 'CANCEL_RECORDING' });
    setPhase('hidden');
  }

  function handleOpenApp() {
    if (!successNote) return;
    const url = `${GOOSHA_APP_URL}/notes/${successNote.id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (phase === 'hidden') return null;

  return (
    <>
      {phase === 'consent' ? (
        <ConsentModal
          meetingTitle={meetingTitle}
          onAccept={() => void handleAcceptConsent()}
          onDecline={handleDeclineConsent}
          loading={consentLoading}
          error={consentError}
        />
      ) : null}

      {phase === 'recorder' ? (
        <RecorderOverlay
          previewStream={previewStream}
          elapsedMs={recordingState.elapsedMs}
          isPaused={recordingState.isPaused}
          isProcessing={recordingState.status === 'processing'}
          error={recordingState.error}
          onPause={() => void handlePause()}
          onResume={() => void handleResume()}
          onStop={() => void handleStop()}
          onCancel={() => void handleCancel()}
        />
      ) : null}

      {phase === 'success' && successNote ? (
        <SuccessToast
          noteTitle={successNote.title}
          noteId={successNote.id}
          onOpenApp={handleOpenApp}
          onDismiss={() => setPhase('hidden')}
        />
      ) : null}
    </>
  );
}

export default defineContentScript({
  matches: ['https://meet.google.com/*'],
  runAt: 'document_idle',
  main() {
    try {
      mountShadowUi(<MeetApp />);
    } catch (error) {
      console.error('[Goosha] failed to mount Meet UI', error);
    }
  },
});
