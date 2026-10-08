import type { JSONContent } from '@tiptap/react';
import { TRANSCRIPT_HEADING } from '@jalase/shared';

export const EMPTY_NOTE_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export interface DefaultNoteSectionLabels {
  summary: string;
  decisions: string;
  nextActions: string;
  highlights: string;
}

/** English-first defaults. Pass translated labels to localize new notes. */
export const DEFAULT_NOTE_SECTION_LABELS: DefaultNoteSectionLabels = {
  summary: 'Summary',
  decisions: 'Decisions',
  nextActions: 'Next actions',
  highlights: 'Highlights',
};

function sectionHeading(text: string): JSONContent {
  return {
    type: 'heading',
    attrs: { level: 2 },
    content: [{ type: 'text', text }],
  };
}

function emptyBulletList(): JSONContent {
  return {
    type: 'bulletList',
    content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
  };
}

/** Build the starter note template using the given section labels (English by default). */
export function buildDefaultNoteDoc(
  labels: Partial<DefaultNoteSectionLabels> = {},
): JSONContent {
  const l = { ...DEFAULT_NOTE_SECTION_LABELS, ...labels };

  return {
    type: 'doc',
    content: [
      sectionHeading(l.summary),
      emptyBulletList(),
      sectionHeading(l.decisions),
      emptyBulletList(),
      sectionHeading(l.nextActions),
      {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph' }],
          },
        ],
      },
      sectionHeading(l.highlights),
      emptyBulletList(),
    ],
  };
}

export const DEFAULT_NOTE_DOC: JSONContent = buildDefaultNoteDoc();
export function parseNoteContent(raw: string | null | undefined): JSONContent {
  if (!raw?.trim()) {
    return EMPTY_NOTE_DOC;
  }

  try {
    const parsed = JSON.parse(raw) as JSONContent;
    if (parsed?.type === 'doc') {
      return parsed;
    }
  } catch {
    // legacy markdown/plain text
  }

  return markdownToDoc(raw);
}

export function serializeNoteContent(doc: JSONContent): string {
  return JSON.stringify(doc);
}

function markdownToDoc(markdown: string): JSONContent {
  const lines = markdown.split('\n');
  const content: JSONContent[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('## ')) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: trimmed.slice(3) }],
      });
      continue;
    }

    if (trimmed.startsWith('- [ ] ')) {
      content.push({
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: trimmed.slice(6) }] }],
          },
        ],
      });
      continue;
    }

    if (trimmed.startsWith('- ')) {
      content.push({
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: trimmed.slice(2) }] }],
          },
        ],
      });
      continue;
    }

    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: trimmed }],
    });
  }

  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

export function isEmptyNoteContent(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return true;
  try {
    const parsed = JSON.parse(raw) as JSONContent;
    if (parsed.type !== 'doc') return false;
    if (!parsed.content?.length) return true;
    if (
      parsed.content.length === 1 &&
      parsed.content[0]?.type === 'paragraph' &&
      !parsed.content[0]?.content?.length
    ) {
      return true;
    }
    return false;
  } catch {
    return !raw.trim();
  }
}

export function stripTranscriptSection(doc: JSONContent): JSONContent {
  const content = [...(doc.content ?? [])];
  const headingIndex = content.findIndex(
    (node) =>
      node.type === 'heading' &&
      node.content?.[0]?.type === 'text' &&
      node.content[0].text === TRANSCRIPT_HEADING,
  );

  if (headingIndex < 0) {
    return doc;
  }

  let end = content.length;
  for (let i = headingIndex + 1; i < content.length; i += 1) {
    if (content[i]?.type === 'heading') {
      end = i;
      break;
    }
  }

  content.splice(headingIndex, end - headingIndex);
  return { ...doc, content };
}
