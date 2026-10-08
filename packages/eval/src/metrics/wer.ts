import { normalizeEvalText, tokenizeWords } from './normalize.js';
import type { WerResult } from '../types.js';

interface AlignmentCounts {
  substitutions: number;
  deletions: number;
  insertions: number;
  distance: number;
}

function levenshteinCounts(ref: string[], hyp: string[]): AlignmentCounts {
  const n = ref.length;
  const m = hyp.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array<number>(m + 1).fill(0),
  );

  for (let i = 0; i <= n; i += 1) dp[i]![0] = i;
  for (let j = 0; j <= m; j += 1) dp[0]![j] = j;

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const cost = ref[i - 1] === hyp[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }

  let i = n;
  let j = m;
  let substitutions = 0;
  let deletions = 0;
  let insertions = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && ref[i - 1] === hyp[j - 1]) {
      i -= 1;
      j -= 1;
      continue;
    }
    if (i > 0 && j > 0 && dp[i]![j] === dp[i - 1]![j - 1]! + 1) {
      substitutions += 1;
      i -= 1;
      j -= 1;
      continue;
    }
    if (j > 0 && dp[i]![j] === dp[i]![j - 1]! + 1) {
      insertions += 1;
      j -= 1;
      continue;
    }
    deletions += 1;
    i -= 1;
  }

  return {
    substitutions,
    deletions,
    insertions,
    distance: dp[n]![m]!,
  };
}

export function computeWer(
  reference: string,
  hypothesis: string,
  meetingId = 'unknown',
): WerResult {
  const refWords = tokenizeWords(reference);
  const hypWords = tokenizeWords(hypothesis);
  const wordCounts = levenshteinCounts(refWords, hypWords);
  const nWords = refWords.length;
  const wer = nWords === 0 ? 0 : wordCounts.distance / nWords;

  const refChars = normalizeEvalText(reference).replace(/\s+/g, '');
  const hypChars = normalizeEvalText(hypothesis).replace(/\s+/g, '');
  const charCounts = levenshteinCounts(refChars.split(''), hypChars.split(''));
  const nChars = refChars.length;
  const cer = nChars === 0 ? 0 : charCounts.distance / nChars;

  return {
    meetingId,
    wer,
    cer,
    substitutions: wordCounts.substitutions,
    deletions: wordCounts.deletions,
    insertions: wordCounts.insertions,
    nWords,
    nChars,
  };
}

export function meanWer(results: WerResult[]): { mean: number; meanCer: number } {
  if (!results.length) return { mean: 0, meanCer: 0 };
  const totalWords = results.reduce((sum, r) => sum + r.nWords, 0);
  const totalChars = results.reduce((sum, r) => sum + r.nChars, 0);
  if (totalWords === 0) {
    return {
      mean: 0,
      meanCer: totalChars
        ? results.reduce((sum, r) => sum + r.cer * r.nChars, 0) / totalChars
        : 0,
    };
  }
  const weightedWer =
    results.reduce((sum, r) => sum + r.wer * r.nWords, 0) / totalWords;
  const weightedCer = totalChars
    ? results.reduce((sum, r) => sum + r.cer * r.nChars, 0) / totalChars
    : 0;
  return { mean: weightedWer, meanCer: weightedCer };
}
