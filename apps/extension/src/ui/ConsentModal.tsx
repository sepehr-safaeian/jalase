import { t } from '@/lib/i18n/ui-strings';



interface ConsentModalProps {

  meetingTitle: string | null;

  onAccept: () => void;

  onDecline: () => void;

  loading?: boolean;

  error?: string | null;

}



export function ConsentModal({

  meetingTitle,

  onAccept,

  onDecline,

  loading = false,

  error = null,

}: ConsentModalProps) {

  return (

    <div className="goosha-consent-backdrop" role="dialog" aria-modal="true" aria-labelledby="goosha-consent-title">

      <div className="goosha-consent-card">

        <div className="goosha-consent-brand">

          <span className="goosha-consent-logo">{t('brandName')}</span>

          <span className="goosha-consent-tagline">{t('brandTagline')}</span>

        </div>



        <h2 id="goosha-consent-title" className="goosha-consent-title">

          {t('consentTitle')}

        </h2>



        {meetingTitle ? (

          <p className="goosha-consent-meeting">{meetingTitle}</p>

        ) : null}



        <p className="goosha-consent-hint">{t('consentHint')}</p>



        {error ? <p className="goosha-text-error goosha-consent-error">{error}</p> : null}



        <div className="goosha-consent-actions">

          <button

            type="button"

            className="goosha-btn goosha-btn-primary"

            onClick={onAccept}

            disabled={loading}

          >

            {loading ? t('consentAcceptLoading') : t('consentAccept')}

          </button>

          <button

            type="button"

            className="goosha-btn goosha-btn-secondary"

            onClick={onDecline}

            disabled={loading}

          >

            {t('consentDecline')}

          </button>

        </div>

      </div>



      <style>{`

        .goosha-consent-backdrop {

          position: fixed;

          inset: 0;

          z-index: 2147483646;

          display: flex;

          align-items: center;

          justify-content: center;

          background: rgba(14, 15, 12, 0.35);

          padding: 24px;

          pointer-events: auto;

        }

        .goosha-consent-card {

          width: min(400px, 100%);

          background: var(--canvas);

          border: 1px solid var(--border);

          border-radius: var(--radius-lg);

          padding: 28px 24px;

          box-shadow: var(--shadow-overlay);

          text-align: center;

        }

        .goosha-consent-brand {

          display: flex;

          flex-direction: column;

          gap: 4px;

          margin-bottom: 20px;

        }

        .goosha-consent-logo {

          font-size: 22px;

          font-weight: 700;

          color: var(--green-900);

        }

        .goosha-consent-tagline {

          font-size: 13px;

          color: var(--ink-muted);

        }

        .goosha-consent-title {

          font-size: 20px;

          font-weight: 600;

          margin: 0 0 8px;

          color: var(--ink);

        }

        .goosha-consent-meeting {

          font-size: 15px;

          color: var(--ink-soft);

          margin: 0 0 12px;

        }

        .goosha-consent-hint {

          font-size: 14px;

          line-height: 1.6;

          color: var(--ink-muted);

          margin: 0 0 20px;

        }

        .goosha-consent-error {

          margin: 0 0 12px;

          font-size: 13px;

        }

        .goosha-consent-actions {

          display: flex;

          flex-direction: column;

          gap: 10px;

        }

      `}</style>

    </div>

  );

}

