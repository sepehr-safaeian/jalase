import { getUiLocale, type UiLocale } from './ui-locale';

const strings = {
  brandName: { en: 'Jalase', fa: 'جلسه' },
  brandTagline: { en: 'Jalase listens in', fa: 'جلسه به گوشه' },
  taglineRecordMeetings: { en: 'Record online meetings', fa: 'ضبط جلسات آنلاین' },
  taglinePhoneLogin: { en: 'Sign in with mobile number', fa: 'ورود با شماره موبایل' },
  loading: { en: 'Loading...', fa: 'در حال بارگذاری...' },
  loadingAria: { en: 'Loading', fa: 'در حال بارگذاری' },
  signedInHint: {
    en: 'Join a Google Meet session. Jalase will ask if you want to record the meeting.',
    fa: 'در Google Meet وارد جلسه شوید. Jalase از شما می‌پرسد آیا جلسه ضبط شود.',
  },
  signOut: { en: 'Sign out', fa: 'خروج' },
  invalidPhone: { en: 'Invalid mobile number', fa: 'شماره موبایل معتبر نیست' },
  devCodeHint: { en: 'Dev environment: code $1', fa: 'محیط توسعه: کد $1' },
  enterOtp: { en: 'Enter the 6-digit code', fa: 'کد ۶ رقمی را وارد کنید' },
  mobileNumber: { en: 'Mobile number', fa: 'شماره موبایل' },
  getCode: { en: 'Get code', fa: 'دریافت کد' },
  otpSentTo: { en: 'Code sent to $1', fa: 'کد ارسال‌شده به $1' },
  otpPlaceholder: { en: '123456', fa: '۱۲۳۴۵۶' },
  signIn: { en: 'Sign in', fa: 'ورود' },
  changeNumber: { en: 'Change number', fa: 'تغییر شماره' },
  consentTitle: { en: 'Record this meeting?', fa: 'این جلسه ضبط شود؟' },
  consentHint: {
    en: 'Meeting audio is captured from the Meet tab, transcribed when you finish, and saved in the Jalase app. Make sure the Meet tab is not muted.',
    fa: 'صدای جلسه از تب Meet ضبط می‌شود و پس از پایان به متن تبدیل و در اپ Jalase ذخیره می‌شود. مطمئن شوید صدای تب Meet خاموش نیست.',
  },
  consentAccept: { en: 'Yes, record', fa: 'بله، ضبط شود' },
  consentAcceptLoading: { en: 'Preparing...', fa: 'در حال آماده‌سازی...' },
  consentDecline: { en: 'No, thanks', fa: 'نه، ممنون' },
  signInFirst: {
    en: 'Sign in from the extension icon first, then try again.',
    fa: 'لطفاً از آیکون افزونه وارد Jalase شوید، سپس دوباره تلاش کنید.',
  },
  cancelRecordingConfirm: { en: 'Cancel recording?', fa: 'ضبط لغو شود؟' },
  defaultMeetTitle: { en: 'Google Meet session', fa: 'جلسه Google Meet' },
  successTitle: { en: 'Meeting notes are ready', fa: 'یادداشت جلسه آماده است' },
  viewInApp: { en: 'View in Jalase app', fa: 'مشاهده در اپ Jalase' },
  close: { en: 'Close', fa: 'بستن' },
  recorderRegionAria: { en: 'Jalase recording', fa: 'ضبط جلسه' },
  processingTimer: { en: 'Transcribing...', fa: 'در حال تبدیل به متن...' },
  processingHint: {
    en: 'Hang tight, we are writing up your meeting',
    fa: 'صبور باشید، جلسه‌تان را می‌نویسیم',
  },
  pausedHint: {
    en: 'Paused: what is said now is not recorded',
    fa: 'مکث: چیزی که الان گفته می‌شود ضبط نمی‌شود',
  },
  listeningHint: { en: 'Listening to the meeting', fa: 'در حال گوش دادن به جلسه' },
  resume: { en: 'Resume', fa: 'ادامه' },
  pause: { en: 'Pause', fa: 'مکث' },
  stopRecording: { en: 'Stop recording', fa: 'پایان ضبط' },
  extensionUnavailable: {
    en: 'Could not reach the extension. Reload the extension and refresh the Meet page.',
    fa: 'ارتباط با افزونه برقرار نشد. افزونه را Reload کنید و صفحه Meet را Refresh کنید.',
  },
} as const satisfies Record<string, Record<UiLocale, string>>;

export type UiStringKey = keyof typeof strings;

export function t(key: UiStringKey, locale: UiLocale = getUiLocale()): string {
  return strings[key][locale];
}

/** Replace $1, $2, ... placeholders (chrome.i18n-style). */
export function tf(key: UiStringKey, ...substitutions: string[]): string {
  let message = t(key);
  substitutions.forEach((value, index) => {
    message = message.replace(`$${index + 1}`, value);
  });
  return message;
}
