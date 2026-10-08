export const TRANSCRIPT_HEADING = 'Transcript';

export interface TiptapNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string }>;
}

export function syncTranscriptSection(
  doc: TiptapNode,
  fullTranscript: string,
): TiptapNode {
  const content = [...(doc.content ?? [])];
  const lines = fullTranscript
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const transcriptNodes: TiptapNode[] = lines.length
    ? lines.map((line) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      }))
    : [{ type: 'paragraph' }];

  const headingIndex = content.findIndex(
    (node) =>
      node.type === 'heading' &&
      node.content?.[0]?.type === 'text' &&
      node.content[0].text === TRANSCRIPT_HEADING,
  );

  if (headingIndex >= 0) {
    let end = content.length;
    for (let i = headingIndex + 1; i < content.length; i += 1) {
      if (content[i]?.type === 'heading') {
        end = i;
        break;
      }
    }
    content.splice(headingIndex + 1, end - headingIndex - 1, ...transcriptNodes);
    return { ...doc, content };
  }

  return {
    ...doc,
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: TRANSCRIPT_HEADING }],
      },
      ...transcriptNodes,
      ...content,
    ],
  };
}
