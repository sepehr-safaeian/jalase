import { describe, expect, it } from 'vitest';
import {
  decodeNoteSearchCursor,
  encodeNoteSearchCursor,
  escapeIlikePattern,
  isValidSearchQuery,
  normalizeSearchQuery,
  resolveSearchMatch,
} from './search-utils.js';

describe('search-utils', () => {
  it('normalizes whitespace in query', () => {
    expect(normalizeSearchQuery('  جیرا   پروژه  ')).toBe('جیرا پروژه');
  });

  it('validates minimum query length', () => {
    expect(isValidSearchQuery('ج')).toBe(false);
    expect(isValidSearchQuery('جیر')).toBe(true);
  });

  it('escapes ILIKE wildcards', () => {
    expect(escapeIlikePattern('100%')).toBe('100\\%');
    expect(escapeIlikePattern('a_b')).toBe('a\\_b');
  });

  it('prefers title match for snippet', () => {
    const result = resolveSearchMatch(
      'جلسه جیرا',
      '{"type":"doc","content":[{"text":"بدون"}]}',
      '',
      'بحث فنی',
      'جیرا',
    );

    expect(result.matchField).toBe('title');
    expect(result.snippet).toBe('جلسه جیرا');
  });

  it('builds transcript snippet around keyword', () => {
    const longTranscript = `${'متن '.repeat(20)}در مورد جیرا و OKR${' ادامه'.repeat(20)}`;
    const result = resolveSearchMatch('جلسه', '', '', longTranscript, 'جیرا');

    expect(result.matchField).toBe('transcript');
    expect(result.snippet).toContain('جیرا');
    expect(result.snippet.startsWith('…') || result.snippet.includes('جیرا')).toBe(true);
  });

  it('roundtrips search cursor', () => {
    const encoded = encodeNoteSearchCursor('2026-08-31T10:00:00.000Z', 'note-1');
    expect(decodeNoteSearchCursor(encoded)).toEqual({
      sortAt: '2026-08-31T10:00:00.000Z',
      id: 'note-1',
    });
    expect(decodeNoteSearchCursor('invalid')).toBeNull();
  });
});
