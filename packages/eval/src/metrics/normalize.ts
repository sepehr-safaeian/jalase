/** Shared text normalization for WER and extraction matching. */
export function normalizeEvalText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeWords(input: string): string[] {
  const normalized = normalizeEvalText(input);
  return normalized ? normalized.split(' ') : [];
}

export function tokenSet(input: string): Set<string> {
  return new Set(tokenizeWords(input));
}

export function jaccardTokens(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (!setA.size && !setB.size) return 1;
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
