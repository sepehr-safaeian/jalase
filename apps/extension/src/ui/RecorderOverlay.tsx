import { getDir } from '@/lib/i18n/ui-locale';

import { t } from '@/lib/i18n/ui-strings';

import { formatRecordingTime } from '@/lib/recording/format-recording-time';

import { AudioFrequencyVisualizer } from './AudioFrequencyVisualizer';



interface RecorderOverlayProps {

  previewStream: MediaStream | null;

  elapsedMs: number;

  isPaused: boolean;

  isProcessing: boolean;

  error: string | null;

  onPause: () => void;

  onResume: () => void;

  onStop: () => void;

  onCancel: () => void;

}



export function RecorderOverlay({

  previewStream,

  elapsedMs,

  isPaused,

  isProcessing,

  error,

  onPause,

  onResume,

  onStop,

  onCancel,

}: RecorderOverlayProps) {

  const dir = getDir();

  const visualizerActive = !isPaused && !isProcessing;

  const timerLabel = isProcessing

    ? t('processingTimer')

    : formatRecordingTime(elapsedMs);



  const statusHint = isProcessing

    ? t('processingHint')

    : isPaused

      ? t('pausedHint')

      : t('listeningHint');



  return (

    <div className="goosha-recorder" role="region" aria-label={t('recorderRegionAria')}>

      <div className="goosha-recorder-inner">

        <button

          type="button"

          className="goosha-recorder-close"

          onClick={onCancel}

          disabled={isProcessing}

          aria-label={t('close')}

        >

          ×

        </button>



        <div className="goosha-recorder-visual">

          <AudioFrequencyVisualizer

            stream={previewStream}

            isActive={visualizerActive}

            size={200}

          />

          <div className="goosha-recorder-brand">

            <span className="goosha-recorder-brand-title">{t('brandName')}</span>

            <span className="goosha-recorder-brand-tag">{t('brandTagline')}</span>

          </div>

        </div>



        <div className="goosha-recorder-status">

          <div className="goosha-recorder-timer">{timerLabel}</div>

          <div className="goosha-recorder-hint">{statusHint}</div>

        </div>



        {error ? <div className="goosha-text-error goosha-recorder-error">{error}</div> : null}



        <div className="goosha-recorder-controls" data-dir={dir}>

          <button

            type="button"

            className="goosha-btn goosha-btn-secondary goosha-recorder-pause"

            onClick={isPaused ? onResume : onPause}

            disabled={isProcessing}

          >

            {isPaused ? `▶ ${t('resume')}` : `⏸ ${t('pause')}`}

          </button>

          <button

            type="button"

            className="goosha-btn goosha-btn-primary goosha-recorder-stop"

            onClick={onStop}

            disabled={isProcessing}

          >

            {isProcessing ? '...' : `⏹ ${t('stopRecording')}`}

          </button>

        </div>

      </div>



      <style>{`

        .goosha-recorder {

          position: fixed;

          bottom: 24px;

          inset-inline-start: 24px;

          z-index: 2147483647;

          font-family: var(--font-ui);

          pointer-events: auto;

        }

        .goosha-recorder-inner {

          width: 280px;

          background: var(--canvas);

          border: 1px solid var(--border);

          border-radius: var(--radius-lg);

          padding: 16px;

          box-shadow: var(--shadow-overlay);

          position: relative;

        }

        .goosha-recorder-close {

          position: absolute;

          top: 12px;

          inset-inline-start: 12px;

          width: 32px;

          height: 32px;

          border-radius: var(--radius-pill);

          border: 1px solid var(--border);

          background: var(--surface);

          color: var(--ink);

          font-size: 18px;

          line-height: 1;

          cursor: pointer;

          display: flex;

          align-items: center;

          justify-content: center;

        }

        .goosha-recorder-close:disabled {

          opacity: 0.45;

          cursor: not-allowed;

        }

        .goosha-recorder-visual {

          position: relative;

          display: flex;

          align-items: center;

          justify-content: center;

          margin: 8px 0 12px;

          min-height: 200px;

        }

        .goosha-recorder-brand {

          position: absolute;

          inset: 0;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          gap: 4px;

          pointer-events: none;

        }

        .goosha-recorder-brand-title {

          font-size: 18px;

          font-weight: 700;

          color: var(--ink);

        }

        .goosha-recorder-brand-tag {

          font-size: 12px;

          color: var(--ink-muted);

        }

        .goosha-recorder-status {

          text-align: center;

          margin-bottom: 12px;

        }

        .goosha-recorder-timer {

          font-size: 18px;

          font-weight: 600;

          font-variant-numeric: tabular-nums;

          color: var(--ink);

        }

        .goosha-recorder-hint {

          font-size: 13px;

          color: var(--ink-muted);

          margin-top: 4px;

          line-height: 1.5;

        }

        .goosha-recorder-error {

          text-align: center;

          font-size: 12px;

          margin-bottom: 8px;

        }

        .goosha-recorder-controls {

          display: flex;

          flex-direction: row;

          gap: 8px;

          justify-content: center;

        }

        .goosha-recorder-controls[data-dir="rtl"] {

          flex-direction: row-reverse;

        }

        .goosha-recorder-pause {

          flex: 1;

          padding: 10px 12px;

          font-size: 13px;

        }

        .goosha-recorder-stop {

          flex: 1.2;

          padding: 10px 12px;

          font-size: 13px;

        }

      `}</style>

    </div>

  );

}

