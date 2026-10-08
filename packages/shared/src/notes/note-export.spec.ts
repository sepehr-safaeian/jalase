import { describe, it, expect } from 'vitest';
import {
  buildNoteExportMarkdown,
  docToMarkdown,
  GOOSHA_EXPORT_FOOTER,
} from './note-export.js';

describe('note-export', () => {
  it('docToMarkdown headings and lists را تبدیل می‌کند', () => {
    const markdown = docToMarkdown({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'خلاصه' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'نکته اول' }],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(markdown).toContain('## خلاصه');
    expect(markdown).toContain('- نکته اول');
  });

  it('buildNoteExportMarkdown appends the Jalase export footer', () => {
    const markdown = buildNoteExportMarkdown({
      title: 'Product meeting',
      contentJson: JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Meeting body' }],
          },
        ],
      }),
      transcriptText: '',
    });

    expect(markdown).toContain('# Product meeting');
    expect(markdown).toContain('Meeting body');
    expect(markdown).toContain(GOOSHA_EXPORT_FOOTER);
    expect(markdown).toContain('Jalase');
  });
});

