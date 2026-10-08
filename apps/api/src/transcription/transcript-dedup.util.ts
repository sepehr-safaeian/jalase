export function normalizeTranscriptCompare(text: string): string {
  return text
    .toLocaleLowerCase('fa-IR')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when two transcript strings are identical or one mostly contains the other. */
export function transcriptTextsOverlap(a: string, b: string, threshold = 0.65): boolean {
  const left = normalizeTranscriptCompare(a);
  const right = normalizeTranscriptCompare(b);
  if (!left || !right) return false;
  if (left === right) return true;

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;
  return longer.includes(shorter) && shorter.length / longer.length >= threshold;
}
