import type { FaithfulnessResult } from '../types.js';

export const FAITHFULNESS_RUBRIC = `
You are evaluating meeting summary faithfulness.
Score from 1 to 5:
5 = fully supported by the transcript, no invented facts
4 = minor omissions only, no material hallucination
3 = mostly faithful with one soft overclaim
2 = multiple unsupported claims
1 = largely fabricated or unrelated

Respond with JSON only: {"score": <1-5>, "rationale": "<short>"}.
`.trim();

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
      score: 3,
      rationale: 'Empty summary; neutral heuristic score',
      source: 'heuristic',
    };
  }

  const transcriptLower = transcript.toLowerCase();
  let supported = 0;
  for (const item of summaryItems) {
    const words = item
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    if (!words.length) continue;
    const hits = words.filter((w) => transcriptLower.includes(w)).length;
    if (hits / words.length >= 0.45) supported += 1;
  }

  const ratio = supported / summaryItems.length;
  const score =
    ratio >= 0.9 ? 5 : ratio >= 0.75 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.3 ? 2 : 1;

  return {
    meetingId,
    score,
    rationale: `Heuristic token support ratio=${ratio.toFixed(2)}`,
    source: 'heuristic',
  };
}

function parseJudgeContent(content: string): { score: number; rationale: string } {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Judge response missing JSON object');
  }
  const parsed = JSON.parse(jsonMatch[0]) as {
    score?: unknown;
    rationale?: unknown;
  };
  const score = Number(parsed.score);
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    throw new Error('Judge score out of range');
  }
  return {
    score: Math.round(score),
    rationale:
      typeof parsed.rationale === 'string' ? parsed.rationale : 'No rationale',
  };
}

export async function judgeFaithfulness(options: {
  meetingId: string;
  transcript: string;
  summaryItems: string[];
  cached?: { score: number; rationale: string };
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  allowLive?: boolean;
}): Promise<FaithfulnessResult> {
  const {
    meetingId,
    transcript,
    summaryItems,
    cached,
    apiKey,
    baseUrl = 'https://api.avalai.ir/v1',
    model = 'qwen3.5-flash',
    allowLive = true,
  } = options;

  if (allowLive && apiKey?.trim()) {
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
        score: parsed.score,
        rationale: parsed.rationale,
        source: 'live',
      };
    } catch {
      // Fall through to cached / heuristic
    }
  }

  if (cached) {
    return {
      meetingId,
      score: cached.score,
      rationale: cached.rationale,
      source: 'cached',
    };
  }

  return heuristicFaithfulness(transcript, summaryItems, meetingId);
}
