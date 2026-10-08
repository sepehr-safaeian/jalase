import type { TranscriptTurn } from '@jalase/shared';

const MAX_TURN_CHANGE_RATIO = 0.45;
const MAX_TURN_LENGTH_GROWTH = 1.25;

export function normalizeReviewText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function levenshteinRatio(a: string, b: string): number {
  const left = normalizeReviewText(a);
  const right = normalizeReviewText(b);
  if (!left && !right) return 0;
  if (!left || !right) return 1;

  const matrix = Array.from({ length: left.length + 1 }, () =>
    new Array<number>(right.length + 1).fill(0),
  );

  for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const distance = matrix[left.length][right.length];
  return distance / Math.max(left.length, right.length);
}

export function isSafeReviewChange(original: string, reviewed: string): boolean {
  const source = normalizeReviewText(original);
  const target = normalizeReviewText(reviewed);

  if (!source) return Boolean(target);
  if (!target) return false;

  if (target.length > source.length * MAX_TURN_LENGTH_GROWTH) {
    return false;
  }

  return levenshteinRatio(source, target) <= MAX_TURN_CHANGE_RATIO;
}

export interface ReviewedTurnPayload {
  id: string;
  text: string;
}

export function applyReviewedTurns(
  turns: TranscriptTurn[],
  reviewed: ReviewedTurnPayload[],
): TranscriptTurn[] {
  const byId = new Map(reviewed.map((item) => [item.id, item.text]));

  return turns.map((turn) => {
    const candidate = byId.get(turn.id);
    if (!candidate) {
      return turn;
    }

    const cleaned = normalizeReviewText(candidate);
    if (!cleaned || !isSafeReviewChange(turn.text, cleaned)) {
      return {
        ...turn,
        draftText: turn.draftText || turn.text,
      };
    }

    return {
      ...turn,
      draftText: turn.draftText || turn.text,
      text: cleaned,
      status: 'refined' as const,
    };
  });
}

export function parseReviewJson(raw: string): ReviewedTurnPayload[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payloadText = fenced?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(payloadText) as
      | { turns?: ReviewedTurnPayload[] }
      | ReviewedTurnPayload[];

    const turns = Array.isArray(parsed) ? parsed : parsed.turns;
    if (!Array.isArray(turns)) return [];

    return turns
      .filter(
        (item): item is ReviewedTurnPayload =>
          Boolean(item?.id) && typeof item.text === 'string',
      )
      .map((item) => ({
        id: item.id,
        text: item.text,
      }));
  } catch {
    return [];
  }
}
