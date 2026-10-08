/** وضعیت یک نوبت گفتار در رونوشت زنده */
export type TranscriptTurnStatus = 'draft' | 'refined';

/** یک نوبت گفتار با گوینده و بازه زمانی */
export interface TranscriptTurn {
  id: string;
  speakerId: string;
  speakerLabel: string;
  startMs: number;
  endMs: number;
  /** متن خام diarization */
  draftText: string;
  /** متن نهایی بعد از transcribe روی همان audio */
  text: string;
  status: TranscriptTurnStatus;
  chunkIndex: number;
}

export interface TranscriptDocument {
  version: 1;
  turns: TranscriptTurn[];
}

export function createEmptyTranscriptDocument(): TranscriptDocument {
  return { version: 1, turns: [] };
}

export function parseTranscriptDocument(raw: string): TranscriptDocument {
  if (!raw.trim()) {
    return createEmptyTranscriptDocument();
  }
  try {
    const parsed = JSON.parse(raw) as TranscriptDocument;
    if (parsed.version === 1 && Array.isArray(parsed.turns)) {
      return parsed;
    }
  } catch {
    /* legacy plain text */
  }
  return createEmptyTranscriptDocument();
}

export function serializeTranscriptDocument(doc: TranscriptDocument): string {
  return JSON.stringify(doc);
}

/** HH:MM:SS یا MM:SS */
export function formatTranscriptClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatSpeakerLabel(speakerId: string): string {
  const match = speakerId.match(/(\d+)/);
  if (match) {
    const index = Number(match[1]);
    if (index >= 0 && index < 26) {
      return `گوینده ${String.fromCharCode(65 + index)}`;
    }
    return `گوینده ${index + 1}`;
  }
  if (speakerId.startsWith('گوینده')) {
    return speakerId;
  }
  return `گوینده ${speakerId}`;
}

export function formatTurnLine(
  turn: Pick<TranscriptTurn, 'startMs' | 'speakerLabel' | 'text' | 'draftText' | 'status'>,
  options: { includeTimestamp?: boolean; preferDraft?: boolean } = {},
): string {
  const includeTimestamp = options.includeTimestamp ?? true;
  const text =
    options.preferDraft && turn.status === 'draft'
      ? turn.draftText || turn.text
      : turn.text || turn.draftText;
  if (!text.trim()) return '';
  const prefix = includeTimestamp
    ? `[${formatTranscriptClock(turn.startMs)}] ${turn.speakerLabel}: `
    : `${turn.speakerLabel}: `;
  return `${prefix}${text.trim()}`;
}

export function turnsToFlatTranscript(
  turns: TranscriptTurn[],
  options: { includeTimestamp?: boolean; preferDraft?: boolean } = {},
): string {
  return turns
    .slice()
    .sort((a, b) => a.startMs - b.startMs)
    .map((turn) => formatTurnLine(turn, options))
    .filter(Boolean)
    .join('\n');
}

export function mergeTranscriptTurns(
  existing: TranscriptTurn[],
  incoming: TranscriptTurn[],
): TranscriptTurn[] {
  const byId = new Map<string, TranscriptTurn>();
  for (const turn of existing) {
    byId.set(turn.id, turn);
  }
  for (const turn of incoming) {
    byId.set(turn.id, turn);
  }
  return [...byId.values()].sort((a, b) => a.startMs - b.startMs);
}
