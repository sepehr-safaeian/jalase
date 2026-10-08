import type { TranscriptTurn } from './transcript-segments.js';
import { formatSpeakerLabel } from './transcript-segments.js';

/** speakerId (مثل speaker_0) → نام واقعی کاربر */
export type SpeakerNameMappings = Record<string, string>;

export interface SpeakerProfile {
  speakerId: string;
  defaultLabel: string;
  displayName: string | null;
}

export function parseSpeakerNameMappings(raw: string | null | undefined): SpeakerNameMappings {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as SpeakerNameMappings;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

export function serializeSpeakerNameMappings(mappings: SpeakerNameMappings): string {
  return JSON.stringify(mappings);
}

export function resolveSpeakerDisplayName(
  speakerId: string,
  fallbackLabel: string,
  mappings: SpeakerNameMappings,
): string {
  const mapped = mappings[speakerId]?.trim();
  if (mapped) return mapped;
  return fallbackLabel.trim() || formatSpeakerLabel(speakerId);
}

export function applySpeakerMappingsToTurns(
  turns: TranscriptTurn[],
  mappings: SpeakerNameMappings,
): TranscriptTurn[] {
  return turns.map((turn) => ({
    ...turn,
    speakerLabel: resolveSpeakerDisplayName(
      turn.speakerId,
      turn.speakerLabel,
      mappings,
    ),
  }));
}

export function getUniqueSpeakersFromTurns(turns: TranscriptTurn[]): SpeakerProfile[] {
  const byId = new Map<string, string>();

  for (const turn of turns) {
    if (!byId.has(turn.speakerId)) {
      byId.set(turn.speakerId, turn.speakerLabel || formatSpeakerLabel(turn.speakerId));
    }
  }

  return [...byId.entries()]
    .map(([speakerId, defaultLabel]) => ({
      speakerId,
      defaultLabel,
      displayName: null,
    }))
    .sort((a, b) => a.defaultLabel.localeCompare(b.defaultLabel, 'fa'));
}

export function buildSpeakerProfiles(
  turns: TranscriptTurn[],
  mappings: SpeakerNameMappings,
): SpeakerProfile[] {
  return getUniqueSpeakersFromTurns(turns).map((speaker) => ({
    ...speaker,
    displayName: mappings[speaker.speakerId]?.trim() || null,
  }));
}

export function sanitizeSpeakerName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 100);
}
