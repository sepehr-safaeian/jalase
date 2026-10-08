import { t } from '@/lib/i18n/ui-strings';

const MEET_CALL_SELECTORS = [
  '[data-call-ended]',
  '[data-meeting-title]',
  '[jsname="r4nke"]',
  '[data-self-name]',
  'button[aria-label*="microphone" i]',
  'button[aria-label*="میکروفون"]',
  'button[aria-label*="Leave call" i]',
  'button[aria-label*="Leave meeting" i]',
  'button[aria-label*="ترک تماس" i]',
  'button[aria-label*="ترک جلسه" i]',
  'button[aria-label*="hang up" i]',
  '[data-is-pinned="true"]',
  'video',
];

const MEET_ENDED_SELECTORS = [
  '[data-call-ended="true"]',
  '[data-meeting-ended]',
];

function hasVisibleElement(selectors: string[]): boolean {
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      if (htmlEl.offsetParent !== null || htmlEl.getClientRects().length > 0) {
        return true;
      }
    }
  }
  return false;
}

function isMeetRoomPath(pathname: string): boolean {
  return /^\/[a-z]{3,4}-[a-z]{2,4}-[a-z]{3,4}\/?$/i.test(pathname);
}

function isCallEnded(): boolean {
  return hasVisibleElement(MEET_ENDED_SELECTORS);
}

export function isGoogleMeetInActiveCall(): boolean {
  if (!location.hostname.endsWith('meet.google.com')) return false;
  if (isCallEnded()) return false;

  const path = location.pathname;
  if (path === '/' || path.startsWith('/landing')) return false;

  const hasVideo = document.querySelectorAll('video').length > 0;
  const hasCallUi = hasVisibleElement(MEET_CALL_SELECTORS);
  const inMeetRoom = isMeetRoomPath(path);

  return hasVideo || hasCallUi || inMeetRoom;
}

export function getGoogleMeetTitle(): string | null {
  const dataTitle = document.querySelector('[data-meeting-title]');
  if (dataTitle?.textContent?.trim()) {
    return dataTitle.textContent.trim();
  }

  const title = document.title.replace(/\s*[-–|]\s*Google Meet\s*$/i, '').trim();
  if (title && title !== 'Google Meet' && title !== 'Meet') {
    return title;
  }

  return t('defaultMeetTitle');
}

export function onGoogleMeetCallStateChange(
  callback: (inCall: boolean) => void,
): () => void {
  let lastState = isGoogleMeetInActiveCall();

  const observer = new MutationObserver(() => {
    const next = isGoogleMeetInActiveCall();
    if (next !== lastState) {
      lastState = next;
      callback(next);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  const interval = window.setInterval(() => {
    const next = isGoogleMeetInActiveCall();
    if (next !== lastState) {
      lastState = next;
      callback(next);
    }
  }, 3000);

  return () => {
    observer.disconnect();
    window.clearInterval(interval);
  };
}

export const googleMeetAdapter = {
  id: 'google_meet' as const,
  featureFlag: 'meeting.connect',
  hostPatterns: ['https://meet.google.com/*'],
  matchesUrl(url: string) {
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'meet.google.com';
    } catch {
      return false;
    }
  },
  isInActiveCall: isGoogleMeetInActiveCall,
  getMeetingTitle: getGoogleMeetTitle,
  onCallStateChange: onGoogleMeetCallStateChange,
};
