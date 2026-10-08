import type { Tier } from '../types/tier.js';

export interface FeatureFlag {
  /** Unique flag id */
  key: string;
  /** Display label (English; UI may localize separately) */
  label: string;
  /** Minimum tier required */
  minTier: Tier;
  /** Enabled by default in development */
  enabledInDev: boolean;
  /** When true, the flag is never enabled (OSS kill-switch) */
  disabled?: boolean;
}

/** Product feature flags. Register every new feature here. */
export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'meeting.record',
    label: 'Meeting recording',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'meeting.transcribe',
    label: 'Transcription',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'meeting.transcript.optimize',
    label: 'Transcript optimization',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'meeting.transcript.hybrid',
    label: 'Hybrid transcription (diarize + transcribe)',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'meeting.summarize',
    label: 'Summarization',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'meeting.action_items',
    label: 'Action items',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'meeting.connect',
    label: 'Online meeting connect',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'meeting.connect.extended',
    label: 'Skype, Jitsi, and BigBlueButton connect',
    minTier: 'pro',
    enabledInDev: true,
  },
  {
    key: 'settings.manage',
    label: 'Settings',
    minTier: 'free',
    enabledInDev: true,
  },
  {
    key: 'profile.manage',
    label: 'Profile management',
    minTier: 'free',
    enabledInDev: true,
  },
  {
    key: 'notes.create',
    label: 'Create notes',
    minTier: 'free',
    enabledInDev: true,
  },
  {
    key: 'notes.search',
    label: 'Search notes',
    minTier: 'free',
    enabledInDev: true,
  },
  {
    key: 'subscription.manage',
    label: 'Subscription management',
    minTier: 'free',
    enabledInDev: false,
    // Billing is disabled for the open-source build
    disabled: true,
  },
  {
    key: 'notes.meetingTabs',
    label: 'Meeting time tabs',
    minTier: 'free',
    enabledInDev: true,
  },
  {
    key: 'notes.projects',
    label: 'Project management',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'meeting.insights',
    label: 'Meeting insights',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'ai.guardrails',
    label: 'AI guardrails',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'meeting.transcript.speaker-mapping',
    label: 'Speaker name mapping',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'notes.share',
    label: 'Share meeting notes',
    minTier: 'plus',
    enabledInDev: true,
  },
  {
    key: 'enterprise.local_deploy',
    label: 'Local deployment',
    minTier: 'enterprise',
    enabledInDev: false,
  },
  {
    key: 'enterprise.sso',
    label: 'Enterprise SSO',
    minTier: 'enterprise',
    enabledInDev: false,
  },
];

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[number]['key'];
