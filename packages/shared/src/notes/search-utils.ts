import {
  NOTE_SEARCH_MIN_QUERY_LENGTH,
  NOTE_SEARCH_SNIPPET_RADIUS,
  type NoteSearchMatchField,
} from './search-types.js';

export function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function isValidSearchQuery(value: string): boolean {
  return normalizeSearchQuery(value).length >= NOTE_SEARCH_MIN_QUERY_LENGTH;
}

function stripJsonNoise(value: string): string {
  return value
    .replace(/\\n/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/[{}\[\]":]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMatchIndex(haystack: string, needle: string): number {
  return haystack.toLocaleLowerCase('fa-IR').indexOf(needle.toLocaleLowerCase('fa-IR'));
}

function buildSnippetFromText(
  rawText: string,
  query: string,
  radius = NOTE_SEARCH_SNIPPET_RADIUS,
): string | null {
  const text = stripJsonNoise(rawText);
  if (!text) return null;

  const index = findMatchIndex(text, query);
  if (index < 0) return null;

  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + query.length + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

export function resolveSearchMatch(
  title: string,
  contentJson: string,
  contentMarkdown: string,
  transcriptText: string,
  query: string,
): { matchField: NoteSearchMatchField; snippet: string } {
  const normalizedQuery = normalizeSearchQuery(query);

  if (findMatchIndex(title, normalizedQuery) >= 0) {
    return {
      matchField: 'title',
      snippet: title,
    };
  }

  const transcriptSnippet = buildSnippetFromText(transcriptText, normalizedQuery);
  if (transcriptSnippet) {
    return {
      matchField: 'transcript',
      snippet: transcriptSnippet,
    };
  }

  const markdownSnippet = buildSnippetFromText(contentMarkdown, normalizedQuery);
  if (markdownSnippet) {
    return {
      matchField: 'content',
      snippet: markdownSnippet,
    };
  }

  const contentSnippet = buildSnippetFromText(contentJson, normalizedQuery);
  if (contentSnippet) {
    return {
      matchField: 'content',
      snippet: contentSnippet,
    };
  }

  return {
    matchField: 'content',
    snippet: title,
  };
}

function utf8ToBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const normalized = padded + '='.repeat(padLength);
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeNoteSearchCursor(sortAt: string, id: string): string {
  return utf8ToBase64Url(JSON.stringify({ sortAt, id }));
}

export function decodeNoteSearchCursor(cursor: string): { sortAt: string; id: string } | null {
  try {
    const parsed = JSON.parse(base64UrlToUtf8(cursor)) as {
      sortAt?: string;
      id?: string;
    };

    if (!parsed.sortAt || !parsed.id) return null;
    if (Number.isNaN(new Date(parsed.sortAt).getTime())) return null;

    return { sortAt: parsed.sortAt, id: parsed.id };
  } catch {
    return null;
  }
}

export function getMatchFieldLabel(field: NoteSearchMatchField): string {
  const labels: Record<NoteSearchMatchField, string> = {
    title: 'عنوان',
    content: 'متن یادداشت',
    transcript: 'رونوشت',
  };
  return labels[field];
}
