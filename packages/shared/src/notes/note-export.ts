import type { TranscriptTurn } from './transcript-segments.js';
import { TRANSCRIPT_HEADING } from './transcript-content.js';
import type { TiptapNode } from './transcript-content.js';
import { turnsToFlatTranscript } from './transcript-segments.js';

export const GOOSHA_EXPORT_FOOTER = 'Recorded with Jalase';

export const GOOSHA_EXPORT_FOOTER_MARKDOWN = `\n\n---\n\n*${GOOSHA_EXPORT_FOOTER}*`;

export interface NoteExportSource {
  title: string;
  contentJson: string;
  contentMarkdown?: string;
  transcriptText: string;
  transcriptTurns?: TranscriptTurn[];
  meetingDate?: string | null;
  projectName?: string | null;
  memberCount?: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nodeText(node: TiptapNode): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(nodeText).join('');
}

function inlineToMarkdown(node: TiptapNode): string {
  if (node.type === 'text') {
    let text = node.text ?? '';
    for (const mark of node.marks ?? []) {
      if (mark.type === 'bold') text = `**${text}**`;
      if (mark.type === 'italic') text = `*${text}*`;
      if (mark.type === 'code') text = `\`${text}\``;
    }
    return text;
  }
  return (node.content ?? []).map(inlineToMarkdown).join('');
}

function blockToMarkdown(node: TiptapNode): string {
  switch (node.type) {
    case 'heading': {
      const level = Number(node.attrs?.level ?? 2);
      const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6));
      return `${hashes} ${inlineToMarkdown(node)}`;
    }
    case 'paragraph':
      return inlineToMarkdown(node);
    case 'bulletList':
      return (node.content ?? [])
        .map((item) => `- ${nodeText(item).trim()}`)
        .join('\n');
    case 'orderedList':
      return (node.content ?? [])
        .map((item, index) => `${index + 1}. ${nodeText(item).trim()}`)
        .join('\n');
    case 'taskList':
      return (node.content ?? [])
        .map((item) => {
          const checked = item.attrs?.checked === true;
          return `- [${checked ? 'x' : ' '}] ${nodeText(item).trim()}`;
        })
        .join('\n');
    case 'blockquote':
      return (node.content ?? [])
        .map(blockToMarkdown)
        .filter(Boolean)
        .map((line) => `> ${line}`)
        .join('\n');
    case 'codeBlock':
      return ['```', nodeText(node), '```'].join('\n');
    case 'horizontalRule':
      return '---';
    default:
      if (node.content?.length) {
        return node.content.map(blockToMarkdown).filter(Boolean).join('\n\n');
      }
      return inlineToMarkdown(node);
  }
}

export function docToMarkdown(doc: TiptapNode): string {
  if (doc.type !== 'doc') {
    return blockToMarkdown(doc);
  }

  return (doc.content ?? [])
    .map(blockToMarkdown)
    .filter((block) => block.trim().length > 0)
    .join('\n\n');
}

export function parseNoteDoc(raw: string, legacyMarkdown?: string): TiptapNode {
  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw) as TiptapNode;
      if (parsed?.type === 'doc') return parsed;
    } catch {
      /* legacy */
    }
  }

  if (legacyMarkdown?.trim()) {
    return {
      type: 'doc',
      content: legacyMarkdown
        .split('\n')
        .map((line) => ({
          type: 'paragraph',
          content: [{ type: 'text', text: line }],
        })),
    };
  }

  return { type: 'doc', content: [] };
}

function resolveTranscript(source: NoteExportSource): string {
  if (source.transcriptTurns?.length) {
    return turnsToFlatTranscript(source.transcriptTurns);
  }
  return source.transcriptText.trim();
}

function formatMeetingMeta(source: NoteExportSource): string[] {
  const lines: string[] = [];
  if (source.meetingDate) {
    lines.push(`تاریخ جلسه: ${new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(source.meetingDate))}`);
  }
  if (source.projectName) {
    lines.push(`پروژه: ${source.projectName}`);
  }
  if (source.memberCount && source.memberCount > 0) {
    lines.push(`اعضا: ${source.memberCount} نفر`);
  }
  return lines;
}

export function buildNoteExportMarkdown(source: NoteExportSource): string {
  const doc = parseNoteDoc(source.contentJson, source.contentMarkdown);
  const body = docToMarkdown(doc);
  const transcript = resolveTranscript(source);
  const meta = formatMeetingMeta(source);

  const sections = [`# ${source.title.trim() || 'جلسه بدون عنوان'}`];

  if (meta.length) {
    sections.push(meta.join('\n'));
  }

  if (body.trim()) {
    sections.push(body.trim());
  }

  if (transcript) {
    sections.push(`## ${TRANSCRIPT_HEADING}`, transcript);
  }

  sections.push(GOOSHA_EXPORT_FOOTER_MARKDOWN.trim());

  return sections.join('\n\n');
}

export function buildNoteExportPlainText(source: NoteExportSource): string {
  return buildNoteExportMarkdown(source)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#+\s/gm, '')
    .replace(/^-\s\[[ x]\]\s/gm, '- ')
    .replace(/\*([^*]+)\*/g, '$1');
}

export function buildNoteExportHtml(source: NoteExportSource): string {
  const markdown = buildNoteExportMarkdown(source);
  const lines = markdown.split('\n');
  const bodyParts: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      bodyParts.push('</ul>');
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    if (trimmed.startsWith('# ')) {
      closeList();
      bodyParts.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
      continue;
    }

    if (trimmed.startsWith('## ')) {
      closeList();
      bodyParts.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith('---')) {
      closeList();
      bodyParts.push('<hr />');
      continue;
    }

    if (trimmed.startsWith('- ')) {
      if (!inList) {
        bodyParts.push('<ul>');
        inList = true;
      }
      bodyParts.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
      continue;
    }

    if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
      closeList();
      bodyParts.push(`<p class="footer-note">${escapeHtml(trimmed.slice(1, -1))}</p>`);
      continue;
    }

    closeList();
    bodyParts.push(`<p>${escapeHtml(trimmed)}</p>`);
  }

  closeList();

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(source.title || 'جلسه')}</title>
  <style>
    @page { margin: 28mm 22mm 32mm; }
    body {
      font-family: "Vazirmatn", "Segoe UI", Tahoma, sans-serif;
      background: #f7f7f2;
      color: #0e0f0c;
      line-height: 1.85;
      font-size: 14px;
      margin: 0;
      padding: 32px;
    }
    .page {
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e3e3e3;
      border-radius: 12px;
      padding: 40px 36px 48px;
    }
    h1 {
      font-size: 28px;
      line-height: 1.35;
      margin: 0 0 20px;
      font-weight: 700;
    }
    h2 {
      font-size: 18px;
      margin: 28px 0 12px;
      color: #187a45;
      font-weight: 700;
    }
    p { margin: 0 0 12px; }
    ul { margin: 0 0 16px; padding-right: 22px; }
    li { margin-bottom: 8px; }
    hr {
      border: none;
      border-top: 1px solid #e3e3e3;
      margin: 28px 0;
    }
    .brand-footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e3e3e3;
      text-align: center;
      color: #72726e;
      font-size: 12px;
      letter-spacing: 0.01em;
    }
    .footer-note {
      color: #72726e;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="page">
    ${bodyParts.join('\n    ')}
    <div class="brand-footer">${escapeHtml(GOOSHA_EXPORT_FOOTER)}</div>
  </div>
</body>
</html>`;
}

export function sanitizeExportFilename(title: string): string {
  const base = title.trim() || 'jalase-note';
  return base.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-').slice(0, 80);
}
