const PROMPT_ARTIFACT_PATTERNS = [
  /گوینده[\u200c\s]*ها\s+را\s+با[\s\S]*?برچسب\s+بزن\.?/gi,
  /بخش\s+\d+\s+جلسه\s+کاری\s+فارسی\s+حضوری\.?/gi,
  /ادامه\s+جلسه:?/gi,
  /رونویسی\s+زنده\s+با\s*\.?/gi,
  /در\s+حال\s+رونویسی\.?\.?\.?/gi,
  /املای\s+صحیح\s+کلمات\s+فارسی\s+را\s+رعایت\s+کن\.?/gi,
  /رونویسی\s+جلسه\s+به\s+زبان\s+فارسی\.?/gi,
];

export function normalizeForCompare(text: string): string {
  return text
    .replace(/[\u200c\u200f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function stripPromptArtifacts(text: string): string {
  let cleaned = text.trim();
  for (const pattern of PROMPT_ARTIFACT_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ').trim();
  }
  cleaned = cleaned.replace(/\u200c/g, '');
  return cleaned.replace(/\s+/g, ' ').trim();
}

function words(text: string): string[] {
  return normalizeForCompare(text).split(' ').filter(Boolean);
}

function overlapWordCount(existing: string, chunk: string): number {
  const existingWords = words(existing);
  const chunkWords = words(chunk);
  const max = Math.min(existingWords.length, chunkWords.length);

  for (let size = max; size > 0; size -= 1) {
    const tail = existingWords.slice(-size).join(' ');
    const head = chunkWords.slice(0, size).join(' ');
    if (tail && tail === head) {
      return size;
    }
  }

  return 0;
}

function chunkWordsRaw(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function isLikelyHallucination(delta: string, existing: string): boolean {
  const normDelta = normalizeForCompare(delta);
  if (!normDelta) return true;
  if (normDelta.length < 4) return true;

  const artifactOnly = !stripPromptArtifacts(delta);
  if (artifactOnly) return true;

  const repetition = normDelta.match(/(.{4,}?)\1+/);
  if (repetition) return true;

  const recent = normalizeForCompare(existing.slice(-600));
  if (recent && recent.includes(normDelta)) return true;

  const deltaWords = words(delta);
  if (deltaWords.length >= 6) {
    const recentWords = words(existing.slice(-400));
    const matched = deltaWords.filter((w) => recentWords.includes(w)).length;
    if (matched / deltaWords.length > 0.85) return true;
  }

  return false;
}

/**
 * فقط متن جدید chunk را برمی‌گرداند تا prompt/context باعث loop نشود.
 */
export function extractNewTranscriptDelta(
  existing: string,
  rawChunk: string,
): string {
  const cleaned = stripPromptArtifacts(rawChunk);
  if (!cleaned) return '';

  if (!existing.trim()) {
    return isLikelyHallucination(cleaned, '') ? '' : cleaned;
  }

  const normExisting = normalizeForCompare(existing);
  const normChunk = normalizeForCompare(cleaned);

  if (normChunk.length < 8 && normExisting.includes(normChunk)) {
    return '';
  }

  if (normExisting.includes(normChunk)) {
    return '';
  }

  const overlap = overlapWordCount(existing, cleaned);
  const delta = chunkWordsRaw(cleaned).slice(overlap).join(' ').trim();

  if (!delta || isLikelyHallucination(delta, existing)) {
    return '';
  }

  return delta;
}
