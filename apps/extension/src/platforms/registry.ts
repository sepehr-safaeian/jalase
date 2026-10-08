import type { MeetingPlatformAdapter, MeetingPlatformId } from './types';
import { googleMeetAdapter } from './google-meet';
import {
  bigBlueButtonAdapter,
  jitsiAdapter,
  skypeAdapter,
  teamsAdapter,
} from './stubs';

/** Active adapters. Phase 1: Google Meet only in manifest; others ready for phase 2+. */
export const PLATFORM_ADAPTERS: MeetingPlatformAdapter[] = [
  googleMeetAdapter,
  teamsAdapter,
  skypeAdapter,
  jitsiAdapter,
  bigBlueButtonAdapter,
];

export function getAdapterForUrl(url: string): MeetingPlatformAdapter | null {
  return PLATFORM_ADAPTERS.find((adapter) => adapter.matchesUrl(url)) ?? null;
}

export function getAdapterById(
  id: MeetingPlatformId,
): MeetingPlatformAdapter | null {
  return PLATFORM_ADAPTERS.find((adapter) => adapter.id === id) ?? null;
}

/** Host permissions for all supported platforms (used when expanding manifest) */
export function getAllHostPatterns(): string[] {
  const patterns = new Set<string>();
  for (const adapter of PLATFORM_ADAPTERS) {
    for (const pattern of adapter.hostPatterns) {
      patterns.add(pattern);
    }
  }
  return [...patterns];
}

export { googleMeetAdapter };
