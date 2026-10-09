import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TranscriptTurn } from '@jalase/shared';
import {
  getReviewSystemPrompt,
} from '../ai/prompt-packs.js';
import {
  resolveAiLocale,
  type AiLocale,
} from '../ai/prompt-locale.js';
import {
  assertLlmConfigured,
  resolveLlmRuntimeConfig,
  type LlmRuntimeConfig,
} from '../ai/llm-config.js';
import {
  applyReviewedTurns,
  parseReviewJson,
  type ReviewedTurnPayload,
} from './transcript-review.util.js';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

const REVIEW_TIMEOUT_MS = 90_000;

@Injectable()
export class TranscriptRefinerService {
  private readonly logger = new Logger(TranscriptRefinerService.name);
  private readonly runtime: LlmRuntimeConfig;

  constructor(private readonly config: ConfigService) {
    this.runtime = resolveLlmRuntimeConfig(config);
  }

  isConfigured(): boolean {
    return (
      this.runtime.refineEnabled &&
      Boolean(this.runtime.apiKey.trim() && this.runtime.baseUrl.trim())
    );
  }

  async reviewTurns(
    turns: TranscriptTurn[],
    context?: {
      noteTitle?: string;
      recentContext?: string;
      locale?: string;
    },
  ): Promise<TranscriptTurn[]> {
    if (!this.isConfigured() || !turns.length) {
      return turns;
    }

    const locale = resolveAiLocale(
      context?.locale ?? this.config.get<string>('AI_LOCALE', 'en'),
    );
    const batches = this.chunkTurns(turns, 12);
    const reviewed: ReviewedTurnPayload[] = [];

    for (const batch of batches) {
      const batchReview = await this.reviewBatch(batch, context, turns, locale);
      reviewed.push(...batchReview);
    }

    if (!reviewed.length) {
      return turns;
    }

    return applyReviewedTurns(turns, reviewed);
  }

  private chunkTurns(turns: TranscriptTurn[], size: number): TranscriptTurn[][] {
    const batches: TranscriptTurn[][] = [];
    for (let index = 0; index < turns.length; index += size) {
      batches.push(turns.slice(index, index + size));
    }
    return batches;
  }

  private async reviewBatch(
    batch: TranscriptTurn[],
    context:
      | { noteTitle?: string; recentContext?: string; locale?: string }
      | undefined,
    allTurns: TranscriptTurn[],
    locale: AiLocale,
  ): Promise<ReviewedTurnPayload[]> {
    const payload = {
      meetingTitle: context?.noteTitle ?? null,
      turns: batch.map((turn) => ({
        id: turn.id,
        speaker: turn.speakerLabel,
        startMs: turn.startMs,
        text: turn.text,
      })),
    };

    const meetingContext = this.buildMeetingContext(allTurns, context);
    const userLead =
      locale === 'fa'
        ? 'رونوشت ASR برای بازبینی:'
        : 'ASR transcript for review:';

    try {
      assertLlmConfigured(this.runtime);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REVIEW_TIMEOUT_MS);

      const response = await fetch(`${this.runtime.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.runtime.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.runtime.refineModel,
          temperature: 0,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: getReviewSystemPrompt(locale) },
            {
              role: 'user',
              content: [
                meetingContext,
                userLead,
                JSON.stringify(payload, null, 2),
              ].join('\n\n'),
            },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const body = (await response.json()) as ChatCompletionResponse;
      if (!response.ok) {
        this.logger.warn(
          `Review failed: ${body.error?.message ?? response.statusText}`,
        );
        return [];
      }

      const content = body.choices?.[0]?.message?.content ?? '';
      return parseReviewJson(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Review error (${this.runtime.refineModel}): ${message}; using ASR text without review`,
      );
      return [];
    }
  }

  private buildMeetingContext(
    turns: TranscriptTurn[],
    context?: { noteTitle?: string; recentContext?: string },
  ): string {
    const lines: string[] = [];

    if (context?.noteTitle?.trim()) {
      lines.push(`عنوان جلسه: ${context.noteTitle.trim()}`);
    }

    const vocabulary = this.extractVocabulary(turns);
    if (vocabulary.length) {
      lines.push(`واژگان تکرارشده جلسه: ${vocabulary.join('، ')}`);
    }

    if (context?.recentContext?.trim()) {
      lines.push(`زمینه قبلی: ${context.recentContext.trim().slice(-400)}`);
    }

    return lines.join('\n');
  }

  private extractVocabulary(turns: TranscriptTurn[]): string[] {
    const counts = new Map<string, number>();

    for (const turn of turns) {
      const tokens = turn.text
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 4);

      for (const token of tokens) {
        counts.set(token, (counts.get(token) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([token]) => token);
  }
}
