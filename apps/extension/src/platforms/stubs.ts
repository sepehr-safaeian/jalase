import type { MeetingPlatformAdapter } from './types';
import { googleMeetAdapter } from './google-meet';

/** Phase 2+: Microsoft Teams adapter stub */
export const teamsAdapter: MeetingPlatformAdapter = {
  id: 'microsoft_teams',
  featureFlag: 'meeting.connect',
  hostPatterns: [
    'https://teams.microsoft.com/*',
    'https://teams.live.com/*',
  ],
  matchesUrl(url: string) {
    try {
      const { hostname } = new URL(url);
      return (
        hostname === 'teams.microsoft.com' || hostname === 'teams.live.com'
      );
    } catch {
      return false;
    }
  },
  isInActiveCall() {
    return document.querySelector('[data-tid="call-screen"]') !== null;
  },
  getMeetingTitle() {
    return document.title.replace(/\s*[-|]\s*Microsoft Teams\s*$/i, '').trim() || 'جلسه Teams';
  },
  onCallStateChange(callback) {
    const observer = new MutationObserver(() => {
      callback(this.isInActiveCall());
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  },
};

/** Phase 3: Skype for Business adapter stub */
export const skypeAdapter: MeetingPlatformAdapter = {
  id: 'skype_business',
  featureFlag: 'meeting.connect.extended',
  hostPatterns: ['https://*.skype.com/*'],
  matchesUrl(url: string) {
    try {
      return new URL(url).hostname.endsWith('skype.com');
    } catch {
      return false;
    }
  },
  isInActiveCall() {
    return document.querySelector('video') !== null;
  },
  getMeetingTitle() {
    return document.title || 'جلسه Skype';
  },
  onCallStateChange(callback) {
    const observer = new MutationObserver(() => callback(this.isInActiveCall()));
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  },
};

/** Phase 3: Jitsi adapter stub */
export const jitsiAdapter: MeetingPlatformAdapter = {
  id: 'jitsi',
  featureFlag: 'meeting.connect.extended',
  hostPatterns: ['https://*/*'],
  matchesUrl(_url: string) {
    return typeof (window as unknown as { JitsiMeetJS?: unknown }).JitsiMeetJS !== 'undefined';
  },
  isInActiveCall() {
    return document.querySelector('#react #videoconference_page') !== null
      || document.querySelector('.videocontainer') !== null;
  },
  getMeetingTitle() {
    return document.title || 'جلسه Jitsi';
  },
  onCallStateChange(callback) {
    const observer = new MutationObserver(() => callback(this.isInActiveCall()));
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  },
};

/** Phase 3: BigBlueButton adapter stub */
export const bigBlueButtonAdapter: MeetingPlatformAdapter = {
  id: 'bigbluebutton',
  featureFlag: 'meeting.connect.extended',
  hostPatterns: ['https://*/*/html5client/*'],
  matchesUrl(url: string) {
    return url.includes('/html5client/');
  },
  isInActiveCall() {
    return document.querySelector('[data-test="joinMeeting"]') === null
      && document.querySelector('video') !== null;
  },
  getMeetingTitle() {
    return document.title || 'جلسه BigBlueButton';
  },
  onCallStateChange(callback) {
    const observer = new MutationObserver(() => callback(this.isInActiveCall()));
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  },
};
