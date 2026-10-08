import { describe, expect, it } from 'vitest';
import {
  syncTranscriptSection,
  TRANSCRIPT_HEADING,
  type TiptapNode,
} from './transcript-content.js';

describe('syncTranscriptSection', () => {
  it('inserts transcript heading and paragraphs', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph' }] };
    const next = syncTranscriptSection(doc, 'گوینده ۱: سلام\nگوینده ۲: وقت بخیر');

    expect(next.content?.[0]?.content?.[0]?.text).toBe(TRANSCRIPT_HEADING);
    expect(next.content?.[1]?.content?.[0]?.text).toBe('گوینده ۱: سلام');
  });

  it('updates existing transcript section', () => {
    const doc = syncTranscriptSection({ type: 'doc', content: [] }, 'قدیم');
    const next = syncTranscriptSection(doc, 'قدیم\nجدید');

    const paragraphs =
      next.content?.filter((node: TiptapNode) => node.type === 'paragraph') ?? [];
    expect(paragraphs).toHaveLength(2);
  });
});
