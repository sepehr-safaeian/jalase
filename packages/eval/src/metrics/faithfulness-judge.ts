import type { FaithfulnessResult } from '../types.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const FAITHFULNESS_RUBRIC = readFileSync(
  join(HERE, '../../rubrics/faithfulness-v1.md'),
  'utf8',
);

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

function heuristicFaithfulness(
  transcript: string,
  summaryItems: string[],
  meetingId: string,
): FaithfulnessResult {
  if (!summaryItems.length) {
    return {
      meetingId,
      meanScore: 0,
      supportedRate: 0,
      itemCount: 0,
      source: 'absent',
      judgeModel: null,
    };
  }

  const transcriptLower = transcript.toLowerCase();
  let supported = 0;
  let scoreSum = 0;
  for (const item of summaryItems) {
    const words = item
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    if (!words.length) continue;
    const hits = words.filter((w) => transcriptLower.includes(w)).length;
    const ratio = hits / words.length;
    const score =
      ratio >= 0.9 ? 5 : ratio >= 0.75 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.3 ? 2 : 1;
    scoreSum += score;
    if (score >= 4) supported += 1;
  }

  return {
    meetingId,
    meanScore: scoreSum / summaryItems.length,
    supportedRate: supported / summaryItems.length,
    itemCount: summaryItems.length,
    source: 'heuristic',
    judgeModel: null,
  };
}

function parseJudgeContent(content: string): {
  meanScore: number;
  supportedRate: number;
  itemCount: number;
} {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Judge response missing JSON object');
  }
  const parsed = JSON.parse(jsonMatch[0]) as {
    meanScore?: unknown;
    items?: Array<{ score?: unknown; supported?: unknown }>;
  };
  if (Array.isArray(parsed.items) && parsed.items.length) {
    const scores = parsed.items.map((item) => Number(item.score) || 1);
    const supported = parsed.items.filter(
      (item) => item.supported === true || Number(item.score) >= 4,
    ).length;
    return {
      meanScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      supportedRate: supported / parsed.items.length,
      itemCount: parsed.items.length,
    };
  }
  const meanScore = Number(parsed.meanScore);
  if (!Number.isFinite(meanScore)) {
    throw new Error('Judge score out of range');
  }
  return {
    meanScore,
    supportedRate: meanScore >= 4 ? 1 : 0,
    itemCount: 1,
  };
}

export async function judgeFaithfulness(options: {
  meetingId: string;
  transcript: string;
  summaryItems: string[];
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  allowLive?: boolean;
}): Promise<FaithfulnessResult> {
  const {
    meetingId,
    transcript,
    summaryItems,
    apiKey,
    baseUrl,
    model = 'gpt-4o-mini',
    allowLive = true,
  } = options;

  if (allowLive && apiKey?.trim() && baseUrl?.trim()) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: FAITHFULNESS_RUBRIC },
            {
              role: 'user',
              content: [
                'Transcript:',
                transcript.slice(0, 12_000),
                '',
                'Summary bullets:',
                ...summaryItems.map((item, i) => `${i + 1}. ${item}`),
              ].join('\n'),
            },
          ],
        }),
      });
      const body = (await response.json()) as ChatCompletionResponse;
      if (!response.ok) {
        throw new Error(body.error?.message ?? response.statusText);
      }
      const content = body.choices?.[0]?.message?.content ?? '';
      const parsed = parseJudgeContent(content);
      return {
        meetingId,
        meanScore: parsed.meanScore,
        supportedRate: parsed.supportedRate,
        itemCount: parsed.itemCount,
        source: 'live',
        judgeModel: model,
      };
    } catch {
      // Fall through to heuristic
    }
  }

  return heuristicFaithfulness(transcript, summaryItems, meetingId);
}
