import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NOTE_DOC,
  isEmptyNoteContent,
  parseNoteContent,
  serializeNoteContent,
} from './note-content';

describe('note-content', () => {
  it('parses valid Tiptap JSON', () => {
    const raw = serializeNoteContent(DEFAULT_NOTE_DOC);
    const doc = parseNoteContent(raw);
    expect(doc.type).toBe('doc');
    expect(doc.content?.[0]?.type).toBe('heading');
  });

  it('converts legacy markdown to doc', () => {
    const doc = parseNoteContent('## خلاصه\n\n- یک نکته');
    expect(doc.content?.[0]?.type).toBe('heading');
    expect(doc.content?.[1]?.type).toBe('bulletList');
  });

  it('detects empty note content', () => {
    expect(isEmptyNoteContent('')).toBe(true);
    expect(isEmptyNoteContent(serializeNoteContent({ type: 'doc', content: [{ type: 'paragraph' }] }))).toBe(true);
    expect(isEmptyNoteContent(serializeNoteContent(DEFAULT_NOTE_DOC))).toBe(false);
  });
});
