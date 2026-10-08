import { t } from '@/lib/i18n/ui-strings';



interface SuccessToastProps {

  noteTitle: string;

  noteId: string;

  onOpenApp: () => void;

  onDismiss: () => void;

}



export function SuccessToast({

  noteTitle,

  noteId,

  onOpenApp,

  onDismiss,

}: SuccessToastProps) {

  return (

    <div className="goosha-success-backdrop">

      <div className="goosha-success-card" role="status">

        <div className="goosha-success-icon">✓</div>

        <h3 className="goosha-success-title">{t('successTitle')}</h3>

        <p className="goosha-success-subtitle">{noteTitle}</p>

        <div className="goosha-success-actions">

          <button type="button" className="goosha-btn goosha-btn-primary" onClick={onOpenApp}>

            {t('viewInApp')}

          </button>

          <button type="button" className="goosha-btn goosha-btn-secondary" onClick={onDismiss}>

            {t('close')}

          </button>

        </div>

        <p className="goosha-success-id">#{noteId.slice(0, 8)}</p>

      </div>



      <style>{`

        .goosha-success-backdrop {

          position: fixed;

          bottom: 24px;

          inset-inline-start: 24px;

          z-index: 2147483647;

          pointer-events: auto;

        }

        .goosha-success-card {

          width: 280px;

          background: var(--surface);

          border: 1px solid var(--border);

          border-radius: var(--radius-lg);

          padding: 20px;

          box-shadow: var(--shadow-overlay);

          text-align: center;

        }

        .goosha-success-icon {

          width: 40px;

          height: 40px;

          margin: 0 auto 12px;

          border-radius: var(--radius-pill);

          background: var(--green-100);

          color: var(--green-900);

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 20px;

          font-weight: 700;

        }

        .goosha-success-title {

          font-size: 16px;

          font-weight: 600;

          margin: 0 0 4px;

          color: var(--ink);

        }

        .goosha-success-subtitle {

          font-size: 13px;

          color: var(--ink-muted);

          margin: 0 0 16px;

        }

        .goosha-success-actions {

          display: flex;

          flex-direction: column;

          gap: 8px;

        }

        .goosha-success-id {

          font-size: 11px;

          color: var(--ink-quiet);

          margin: 12px 0 0;

        }

      `}</style>

    </div>

  );

}

