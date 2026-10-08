import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  vi.stubGlobal('browser', {
    i18n: { getUILanguage: () => 'en-US' },
  });
});
import {
  getGoogleMeetTitle,
  isGoogleMeetInActiveCall,
} from './google-meet';

describe('google-meet adapter', () => {
  it('detects inactive call on landing page', () => {
    document.body.innerHTML = '<div></div>';
    Object.defineProperty(window, 'location', {
      value: { hostname: 'meet.google.com', pathname: '/landing' },
      writable: true,
    });
    expect(isGoogleMeetInActiveCall()).toBe(false);
  });

  it('detects active call when video is present', () => {
    document.body.innerHTML = '<video></video>';
    Object.defineProperty(window, 'location', {
      value: { hostname: 'meet.google.com', pathname: '/abc-defg-hij' },
      writable: true,
    });
    expect(isGoogleMeetInActiveCall()).toBe(true);
  });

  it('detects active call when meeting room path is present', () => {
    document.body.innerHTML = '<div></div>';
    Object.defineProperty(window, 'location', {
      value: { hostname: 'meet.google.com', pathname: '/abc-defg-hij' },
      writable: true,
    });
    expect(isGoogleMeetInActiveCall()).toBe(true);
  });

  it('extracts meeting title from data attribute', () => {
    document.body.innerHTML =
      '<div data-meeting-title>جلسه هفتگی تیم</div>';
    Object.defineProperty(document, 'title', {
      value: 'Google Meet',
      writable: true,
    });
    expect(getGoogleMeetTitle()).toBe('جلسه هفتگی تیم');
  });

  it('falls back to document title', () => {
    document.body.innerHTML = '';
    Object.defineProperty(document, 'title', {
      value: 'Sync Standup - Google Meet',
      writable: true,
    });
    expect(getGoogleMeetTitle()).toBe('Sync Standup');
  });

  it('falls back to localized default when title is generic', () => {
    document.body.innerHTML = '';
    Object.defineProperty(document, 'title', {
      value: 'Google Meet',
      writable: true,
    });
    expect(getGoogleMeetTitle()).toBe('Google Meet session');
  });
});
