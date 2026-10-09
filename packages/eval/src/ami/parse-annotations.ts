import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AmiGoldLabels } from '../types.js';

function extractTagBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    blocks.push(match[1] ?? '');
  }
  return blocks;
}

function extractSentences(block: string): string[] {
  const sentences: string[] = [];
  const re = /<sentence[^>]*>([\s\S]*?)<\/sentence>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(block)) !== null) {
    const text = (match[1] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) sentences.push(text);
  }
  return sentences;
}

function parseWordsXml(xml: string): string {
  const words: Array<{ start: number; text: string }> = [];
  const re =
    /<w\b[^>]*\bstarttime="([^"]+)"[^>]*>([\s\S]*?)<\/w>|<w\b[^>]*>([\s\S]*?)<\/w>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const start = Number(match[1] ?? 0);
    const text = (match[2] ?? match[3] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text || text === '.' || text === ',') continue;
    words.push({ start: Number.isFinite(start) ? start : 0, text });
  }
  words.sort((a, b) => a.start - b.start);
  return words.map((w) => w.text).join(' ').replace(/\s+/g, ' ').trim();
}

function findFiles(root: string, meetingId: string, suffix: string): string[] {
  const hits: string[] = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (
        entry.name.startsWith(meetingId) &&
        entry.name.toLowerCase().includes(suffix.toLowerCase())
      ) {
        hits.push(full);
      }
    }
  }
  return hits.sort();
}

export function parseAmiMeetingGold(
  annotationsRoot: string,
  meetingId: string,
): AmiGoldLabels {
  const wordFiles = findFiles(annotationsRoot, meetingId, '.words.xml');
  if (!wordFiles.length) {
    throw new Error(`No words XML for ${meetingId} under ${annotationsRoot}`);
  }

  const transcriptParts = wordFiles.map((file) =>
    parseWordsXml(readFileSync(file, 'utf8')),
  );
  const referenceTranscript = transcriptParts
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const summaryFiles = [
    ...findFiles(annotationsRoot, meetingId, '.abssumm.xml'),
    ...findFiles(annotationsRoot, meetingId, 'abstractive'),
  ];
  let decisions: string[] = [];
  let next_actions: string[] = [];
  let abstractSentences: string[] = [];

  for (const file of summaryFiles) {
    const xml = readFileSync(file, 'utf8');
    for (const block of extractTagBlocks(xml, 'decisions')) {
      decisions.push(...extractSentences(block));
    }
    for (const block of extractTagBlocks(xml, 'actions')) {
      next_actions.push(...extractSentences(block));
    }
    for (const block of extractTagBlocks(xml, 'abstract')) {
      abstractSentences.push(...extractSentences(block));
    }
  }

  decisions = [...new Set(decisions.map((s) => s.trim()).filter(Boolean))];
  next_actions = [...new Set(next_actions.map((s) => s.trim()).filter(Boolean))];
  abstractSentences = [
    ...new Set(abstractSentences.map((s) => s.trim()).filter(Boolean)),
  ];

  return {
    meetingId,
    referenceTranscript,
    decisions,
    next_actions,
    summary: abstractSentences,
    abstractSentences,
  };
}
