import { useEffect, useState } from 'react';

import { getDir } from '@/lib/i18n/ui-locale';

import { t } from '@/lib/i18n/ui-strings';

import { PhoneLogin } from './PhoneLogin';

import { sendToBackground } from '@/lib/messaging/send';

import type { SessionPayload } from '@/lib/messaging/types';



export default function App() {

  const [session, setSession] = useState<SessionPayload | null>(null);

  const [loading, setLoading] = useState(true);

  const dir = getDir();



  useEffect(() => {

    void sendToBackground({ type: 'GET_SESSION' }).then((result) => {

      if (result.ok && result.session) {

        setSession(result.session);

      }

      setLoading(false);

    });

  }, []);



  if (loading) {

    return (

      <div className="popup-root" dir={dir} aria-busy="true" aria-label={t('loadingAria')}>

        <div className="popup-loading">

          <div className="popup-loading-brand">

            <span className="popup-loading-logo">{t('brandName')}</span>

            <span className="popup-loading-tagline">{t('loading')}</span>

          </div>

          <div className="popup-loading-body">

            <div className="popup-loading-line popup-loading-line--short" />

            <div className="popup-loading-line" />

            <div className="popup-loading-line popup-loading-line--button" />

          </div>

        </div>

      </div>

    );

  }



  return (

    <div className="popup-root" dir={dir}>

      <PhoneLogin

        session={session ?? { isAuthenticated: false, user: null }}

        onSessionChange={setSession}

      />

      <footer className="popup-footer">

        <a href="https://jalase.me" target="_blank" rel="noopener noreferrer">

          jalase.me

        </a>

      </footer>

    </div>

  );

}

