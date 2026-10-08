import { jaccardTokens } from './normalize.js';
import type { ExtractionF1Result } from '../types.js';

const DEFAULT_MATCH_THRESHOLD = 0.5;

export function matchExtractions(
  predicted: string[],
  gold: string[],
  threshold = DEFAULT_MATCH_THRESHOLD,
): { matched: number; predicted: number; gold: number } {
  const usedGold = new Set<number>();
  let matched = 0;

  for (const pred of predicted) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < gold.length; i += 1) {
      if (usedGold.has(i)) continue;
      const score = jaccardTokens(pred, gold[i]!);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && bestScore >= threshold) {
      usedGold.add(bestIdx);
      matched += 1;
    }
  }

  return {
    matched,
    predicted: predicted.length,
    gold: gold.length,
  };
}

export function scoreExtractionKind(
  meetingId: string,
  kind: 'decisions' | 'next_actions',
  predicted: string[],
  gold: string[],
  threshold = DEFAULT_MATCH_THRESHOLD,
): ExtractionF1Result {
  const { matched, predicted: p, gold: g } = matchExtractions(
    predicted,
    gold,
    threshold,
  );
  const precision = p === 0 ? (g === 0 ? 1 : 0) : matched / p;
  const recall = g === 0 ? (p === 0 ? 1 : 0) : matched / g;
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);

  return {
    meetingId,
    kind,
    precision,
    recall,
    f1,
    matched,
    predicted: p,
    gold: g,
  };
}

export function aggregateExtractionF1(
  rows: ExtractionF1Result[],
): { precision: number; recall: number; f1: number } {
  const predicted = rows.reduce((sum, r) => sum + r.predicted, 0);
  const gold = rows.reduce((sum, r) => sum + r.gold, 0);
  const matched = rows.reduce((sum, r) => sum + r.matched, 0);
  const precision = predicted === 0 ? (gold === 0 ? 1 : 0) : matched / predicted;
  const recall = gold === 0 ? (predicted === 0 ? 1 : 0) : matched / gold;
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);
  return { precision, recall, f1 };
}
