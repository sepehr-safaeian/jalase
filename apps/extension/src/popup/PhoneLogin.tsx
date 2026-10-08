import { useCallback, useState } from 'react';

import {

  formatIranPhoneDisplay,

  isValidIranPhone,

  toIranE164,

} from '@/lib/auth/phone.utils';

import { t, tf } from '@/lib/i18n/ui-strings';

import { sendToBackground } from '@/lib/messaging/send';

import type { SessionPayload } from '@/lib/messaging/types';



interface PhoneLoginProps {

  session: SessionPayload;

  onSessionChange: (session: SessionPayload) => void;

}



export function PhoneLogin({ session, onSessionChange }: PhoneLoginProps) {

  const [phone, setPhone] = useState('');

  const [code, setCode] = useState('');

  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);



  const handleSignOut = useCallback(async () => {

    setLoading(true);

    const result = await sendToBackground({ type: 'SIGN_OUT' });

    setLoading(false);

    if (result.ok && result.session) {

      onSessionChange(result.session);

    }

  }, [onSessionChange]);



  if (session.isAuthenticated && session.user) {

    return (

      <div className="popup-session">

        <div className="popup-brand">

          <span className="popup-logo">{t('brandName')}</span>

          <span className="popup-tagline">{t('taglineRecordMeetings')}</span>

        </div>

        <p className="popup-user">

          {session.user.displayName ?? formatIranPhoneDisplay(session.user.phone)}

        </p>

        <p className="popup-hint">{t('signedInHint')}</p>

        <button

          type="button"

          className="goosha-btn goosha-btn-secondary popup-signout"

          onClick={() => void handleSignOut()}

          disabled={loading}

        >

          {t('signOut')}

        </button>

      </div>

    );

  }



  async function handleSendCode() {

    const e164 = toIranE164(phone);

    if (!e164) {

      setError(t('invalidPhone'));

      return;

    }



    setLoading(true);

    setError(null);



    const result = await sendToBackground({ type: 'SEND_OTP', phone: e164 });

    setLoading(false);



    if (!result.ok) {

      setError(result.error);

      return;

    }



    if (result.devCode) {

      setDevCodeHint(tf('devCodeHint', result.devCode));

    }

    setStep('otp');

  }



  async function handleVerify() {

    const e164 = toIranE164(phone);

    if (!e164 || code.length !== 6) {

      setError(t('enterOtp'));

      return;

    }



    setLoading(true);

    setError(null);



    const result = await sendToBackground({

      type: 'SIGN_IN',

      phone: e164,

      code,

    });

    setLoading(false);



    if (!result.ok) {

      setError(result.error);

      return;

    }



    if (result.session) {

      onSessionChange(result.session);

    }

  }



  const isPhoneStep = step === 'phone';



  function handlePhoneChange(raw: string) {

    const digits = raw.replace(/\D/g, '').slice(0, 11);

    if (digits.length === 0) {

      setPhone('');

      return;

    }



    const normalized = digits.startsWith('0') ? digits : `0${digits}`;

    setPhone(formatIranPhoneDisplay(normalized));

  }



  const phoneFieldValue = phone.startsWith('0') ? phone.slice(1) : phone;



  return (

    <div className="popup-login">

      <div className="popup-brand">

        <span className="popup-logo">{t('brandName')}</span>

        <span className="popup-tagline">{t('taglinePhoneLogin')}</span>

      </div>



      {isPhoneStep ? (

        <>

          <label className="popup-label" htmlFor="goosha-phone">

            {t('mobileNumber')}

          </label>

          <div className="popup-phone-field">

            <span className="popup-phone-prefix" aria-hidden="true">

              +98

            </span>

            <input

              id="goosha-phone"

              className="popup-input popup-input--phone"

              type="tel"

              inputMode="tel"

              placeholder="912 345 6789"

              value={phoneFieldValue}

              onChange={(e) => handlePhoneChange(e.target.value)}

              autoComplete="tel"

            />

          </div>

          <button

            type="button"

            className="goosha-btn goosha-btn-primary popup-submit"

            onClick={() => void handleSendCode()}

            disabled={loading || !isValidIranPhone(phone)}

          >

            {loading ? '...' : t('getCode')}

          </button>

        </>

      ) : (

        <>

          <p className="popup-otp-hint">

            {tf('otpSentTo', formatIranPhoneDisplay(phone))}

          </p>

          {devCodeHint ? <p className="popup-dev-hint">{devCodeHint}</p> : null}

          <input

            className="popup-input popup-otp"

            type="text"

            inputMode="numeric"

            maxLength={6}

            placeholder={t('otpPlaceholder')}

            value={code}

            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}

            dir="ltr"

          />

          <button

            type="button"

            className="goosha-btn goosha-btn-primary popup-submit"

            onClick={() => void handleVerify()}

            disabled={loading || code.length !== 6}

          >

            {loading ? '...' : t('signIn')}

          </button>

          <button

            type="button"

            className="popup-back"

            onClick={() => {

              setStep('phone');

              setCode('');

              setError(null);

            }}

          >

            {t('changeNumber')}

          </button>

        </>

      )}



      {error ? <p className="goosha-text-error popup-error">{error}</p> : null}

    </div>

  );

}

