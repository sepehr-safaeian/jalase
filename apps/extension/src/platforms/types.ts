export type MeetingPlatformId =
  | 'google_meet'
  | 'microsoft_teams'
  | 'skype_business'
  | 'jitsi'
  | 'bigbluebutton';

export interface MeetingPlatformAdapter {
  id: MeetingPlatformId;
  /** Feature flag key required to use this platform */
  featureFlag: string;
  /** Host patterns for manifest host_permissions (phase rollout) */
  hostPatterns: string[];
  /** Whether current page URL belongs to this platform */
  matchesUrl(url: string): boolean;
  /** Whether user is in an active call/meeting */
  isInActiveCall(): boolean;
  /** Extract meeting title for note creation */
  getMeetingTitle(): string | null;
  /** Subscribe to call join/leave changes */
  onCallStateChange(callback: (inCall: boolean) => void): () => void;
}
