import type { TiptapNode } from './transcript-content.js';

export type MeetingExtractionKind =
  | 'summary'
  | 'decisions'
  | 'next_actions'
  | 'highlights';

export type MeetingAiExtractions = Partial<Record<MeetingExtractionKind, string>>;

export interface MeetingExtractionMeta {
  kind: MeetingExtractionKind;
  heading: string;
  title: string;
  subtitle: string;
  listType: 'bullet' | 'task';
}

export interface ExtractionItemCandidate {
  text: string;
  evidence?: string;
  confidence?: number;
}

export interface ParsedExtractionResult {
  hasItems: boolean;
  emptyReason: string | null;
  items: ExtractionItemCandidate[];
}

export const MIN_EXTRACTION_CONFIDENCE = 0.75;

export const EXTRACTION_MAX_ITEMS: Record<MeetingExtractionKind, number> = {
  summary: 5,
  decisions: 5,
  next_actions: 8,
  highlights: 5,
};

export const EMPTY_EXTRACTION_MESSAGES: Record<MeetingExtractionKind, string> = {
  summary: 'Not enough content to summarize.',
  decisions: 'No definite decisions were recorded in this meeting.',
  next_actions: 'No concrete action items were extracted.',
  highlights: 'No important highlights were found.',
};

export const MEETING_EXTRACTION_ORDER: MeetingExtractionKind[] = [
  'summary',
  'decisions',
  'next_actions',
  'highlights',
];

export const MEETING_EXTRACTION_META: Record<
  MeetingExtractionKind,
  MeetingExtractionMeta
> = {
  summary: {
    kind: 'summary',
    heading: 'Summary',
    title: 'Extract meeting summary',
    subtitle: 'A short formal overview of the whole conversation',
    listType: 'bullet',
  },
  decisions: {
    kind: 'decisions',
    heading: 'Decisions',
    title: 'Extract decisions',
    subtitle: 'Final decisions made in the meeting',
    listType: 'bullet',
  },
  next_actions: {
    kind: 'next_actions',
    heading: 'Next actions',
    title: 'Extract next actions',
    subtitle: 'Concrete follow-ups with likely owners',
    listType: 'task',
  },
  highlights: {
    kind: 'highlights',
    heading: 'Highlights',
    title: 'Extract highlights',
    subtitle: 'Key insights for quick reference',
    listType: 'bullet',
  },
};

const FILLER_PATTERNS: RegExp[] = [
  /نیاز به (?:بررسی|بحث|پیگیری) بیشتر/iu,
  /(?:در|برای) این جلسه (?:بحث|گفتگو|صحبت) شد/iu,
  /موضوع (?:مطرح|بررسی) شد/iu,
  /(?:هنوز|هنوزم) (?:تصمیم|اقدام)ی (?:گرفته|تعیین) نشده/iu,
  /اطلاعات کافی (?:وجود ندارد|در دسترس نیست)/iu,
  /جزئیات بیشتری نیاز است/iu,
];

export function parseMeetingAiExtractions(
  raw: string | null | undefined,
): MeetingAiExtractions {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as MeetingAiExtractions;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeMeetingAiExtractions(
  extractions: MeetingAiExtractions,
): string {
  return JSON.stringify(extractions);
}

export function isMeetingExtractionUsed(
  extractions: MeetingAiExtractions,
  kind: MeetingExtractionKind,
): boolean {
  return Boolean(extractions[kind]);
}

export function markMeetingExtractionUsed(
  extractions: MeetingAiExtractions,
  kind: MeetingExtractionKind,
  at: Date = new Date(),
): MeetingAiExtractions {
  return {
    ...extractions,
    [kind]: at.toISOString(),
  };
}

export function normalizeMatchText(text: string): string {
  return text
    .replace(/[\u200c\u200f\u202a-\u202e]/g, '')
    .replace(/[.,!?؛،:"«»()[\]{}]/g, ' ')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function evidenceMatchesTranscript(
  evidence: string,
  transcript: string,
): boolean {
  const normalizedEvidence = normalizeMatchText(evidence);
  const normalizedTranscript = normalizeMatchText(transcript);

  if (!normalizedEvidence || normalizedEvidence.length < 8) {
    return false;
  }

  if (normalizedTranscript.includes(normalizedEvidence)) {
    return true;
  }

  const evidenceWords = normalizedEvidence
    .split(' ')
    .filter((word) => word.length > 2);

  if (!evidenceWords.length) {
    return false;
  }

  const matchedWords = evidenceWords.filter((word) =>
    normalizedTranscript.includes(word),
  ).length;

  return matchedWords / evidenceWords.length >= 0.6;
}

export function isFillerExtractionText(text: string): boolean {
  const normalized = normalizeMatchText(text);
  if (!normalized) return true;
  return FILLER_PATTERNS.some((pattern) => pattern.test(normalized));
}

export interface TranscriptSufficiencyResult {
  sufficient: boolean;
  reason?: string;
}

export function assessTranscriptSufficiency(
  kind: MeetingExtractionKind,
  transcript: string,
): TranscriptSufficiencyResult {
  const normalized = normalizeMatchText(transcript);
  const compactLength = normalized.replace(/\s/g, '').length;
  const wordCount = normalized.split(' ').filter(Boolean).length;

  if (compactLength < 12) {
    return {
      sufficient: false,
      reason: EMPTY_EXTRACTION_MESSAGES[kind],
    };
  }

  if (kind !== 'summary' && wordCount <= 6) {
    return {
      sufficient: false,
      reason: EMPTY_EXTRACTION_MESSAGES[kind],
    };
  }

  if (kind === 'summary' && wordCount <= 3) {
    return {
      sufficient: false,
      reason: EMPTY_EXTRACTION_MESSAGES[kind],
    };
  }

  return { sufficient: true };
}

export function parseExtractionResponse(raw: string): ParsedExtractionResult {
  try {
    const parsed = JSON.parse(raw) as {
      has_items?: unknown;
      empty_reason?: unknown;
      items?: unknown;
    };

    const emptyReason =
      typeof parsed.empty_reason === 'string' && parsed.empty_reason.trim()
        ? parsed.empty_reason.trim()
        : null;

    if (parsed.has_items === false) {
      return {
        hasItems: false,
        emptyReason,
        items: [],
      };
    }

    if (!Array.isArray(parsed.items)) {
      return {
        hasItems: false,
        emptyReason,
        items: [],
      };
    }

    const items = parsed.items
      .map((item) => {
        if (typeof item === 'string') {
          return { text: item.trim() };
        }

        if (!item || typeof item !== 'object') {
          return null;
        }

        const candidate = item as {
          text?: unknown;
          evidence?: unknown;
          confidence?: unknown;
        };

        const text =
          typeof candidate.text === 'string' ? candidate.text.trim() : '';
        if (!text) return null;

        const evidence =
          typeof candidate.evidence === 'string'
            ? candidate.evidence.trim()
            : undefined;

        const confidence =
          typeof candidate.confidence === 'number' &&
          Number.isFinite(candidate.confidence)
            ? candidate.confidence
            : undefined;

        return { text, evidence, confidence };
      })
      .filter((item): item is ExtractionItemCandidate => Boolean(item));

    return {
      hasItems: items.length > 0,
      emptyReason,
      items,
    };
  } catch {
    return {
      hasItems: false,
      emptyReason: null,
      items: [],
    };
  }
}

export function validateExtractionCandidates(
  candidates: ExtractionItemCandidate[],
  transcript: string,
  kind: MeetingExtractionKind,
  minConfidence = MIN_EXTRACTION_CONFIDENCE,
): string[] {
  const maxItems = EXTRACTION_MAX_ITEMS[kind];

  return candidates
    .filter((candidate) => {
      if (!candidate.text || isFillerExtractionText(candidate.text)) {
        return false;
      }

      if (
        typeof candidate.confidence === 'number' &&
        candidate.confidence < minConfidence
      ) {
        return false;
      }

      if (!candidate.evidence) {
        return false;
      }

      return evidenceMatchesTranscript(candidate.evidence, transcript);
    })
    .map((candidate) => candidate.text)
    .slice(0, maxItems);
}

function isHeading(node: TiptapNode, title: string): boolean {
  return (
    node.type === 'heading' &&
    node.content?.[0]?.type === 'text' &&
    node.content[0].text === title
  );
}

function buildEmptyParagraph(message: string): TiptapNode {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text: message }],
  };
}

function buildBulletList(items: string[]): TiptapNode {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: item }],
        },
      ],
    })),
  };
}

function buildTaskList(items: string[]): TiptapNode {
  return {
    type: 'taskList',
    content: items.map((item) => ({
      type: 'taskItem',
      attrs: { checked: false },
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: item }],
        },
      ],
    })),
  };
}

export interface SyncNoteSectionOptions {
  emptyMessage?: string;
}

export function syncNoteSection(
  doc: TiptapNode,
  heading: string,
  items: string[],
  listType: 'bullet' | 'task',
  options?: SyncNoteSectionOptions,
): TiptapNode {
  const content = [...(doc.content ?? [])];
  const sectionNode =
    items.length > 0
      ? listType === 'task'
        ? buildTaskList(items)
        : buildBulletList(items)
      : buildEmptyParagraph(
          options?.emptyMessage ?? 'موردی برای ثبت پیدا نشد.',
        );

  const headingIndex = content.findIndex((node) => isHeading(node, heading));

  if (headingIndex >= 0) {
    let end = content.length;
    for (let index = headingIndex + 1; index < content.length; index += 1) {
      if (content[index]?.type === 'heading') {
        end = index;
        break;
      }
    }
    content.splice(headingIndex + 1, end - headingIndex - 1, sectionNode);
    return { ...doc, content };
  }

  return {
    ...doc,
    content: [
      ...content,
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: heading }],
      },
      sectionNode,
    ],
  };
}

/** @deprecated از parseExtractionResponse استفاده کن */
export function parseExtractionItems(raw: string): string[] {
  return parseExtractionResponse(raw).items.map((item) => item.text);
}
