import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  assertLlmConfigured,
  resolveLlmRuntimeConfig,
  type LlmRuntimeConfig,
} from '../ai/llm-config.js';

const REQUEST_TIMEOUT_MS = 300_000;

export interface DiarizedSegment {
  speaker: string;
  start: number;
  end: number;
  text?: string;
  durationSec: number;
}

export interface DiarizationResult {
  segments: DiarizedSegment[];
  durationSec: number;
}

interface TranscriptionJsonResponse {
  text?: string;
  segments?: Array<{
    speaker?: string;
    start?: number;
    end?: number;
    text?: string;
  }>;
  error?: { message?: string };
}

/** @deprecated Use OpenAiCompatibleClient */
export type AvalAiService = OpenAiCompatibleClient;

@Injectable()
export class OpenAiCompatibleClient {
  private readonly logger = new Logger(OpenAiCompatibleClient.name);
  private readonly runtime: LlmRuntimeConfig;
  private readonly defaultLanguage: string;

  constructor(private readonly config: ConfigService) {
    this.runtime = resolveLlmRuntimeConfig(config);
    this.defaultLanguage =
      this.config.get<string>('TRANSCRIBE_LANGUAGE', 'en').trim().toLowerCase() ||
      'en';
  }

  isConfigured(): boolean {
    return Boolean(this.runtime.apiKey.trim() && this.runtime.baseUrl.trim());
  }

  getRuntimeConfig(): LlmRuntimeConfig {
    return this.runtime;
  }

  getDiarizeModel(): string {
    return this.runtime.diarizeModel;
  }

  getTranscribeModel(): string {
    return this.runtime.asrModel;
  }

  /** WHO + WHEN: speaker labels and timestamps */
  async diarizeChunk(params: {
    audio: Buffer;
    mimeType: string;
    chunkIndex: number;
    language?: string;
  }): Promise<DiarizationResult> {
    const form = this.buildAudioForm(params, this.runtime.diarizeModel);
    form.append('response_format', 'diarized_json');
    form.append('chunking_strategy', 'auto');
    form.append('language', params.language ?? this.defaultLanguage);

    const payload = await this.postTranscription(
      form,
      this.runtime.diarizeModel,
    );
    const durationSec = this.estimateDurationSec(params.audio.length);

    const segments = (payload.segments ?? [])
      .map((segment) => ({
        speaker: segment.speaker ?? 'speaker_0',
        start: segment.start ?? 0,
        end: segment.end ?? durationSec,
        text: segment.text?.trim() ?? '',
        durationSec,
      }))
      .filter((segment) => segment.end > segment.start);

    if (!segments.length && payload.text?.trim()) {
      segments.push({
        speaker: 'speaker_0',
        start: 0,
        end: durationSec,
        text: payload.text.trim(),
        durationSec,
      });
    }

    return { segments, durationSec };
  }

  /** WHAT: accurate transcription on the same audio */
  async transcribeChunk(params: {
    audio: Buffer;
    mimeType: string;
    chunkIndex: number;
    language?: string;
  }): Promise<string> {
    const form = this.buildAudioForm(params, this.runtime.asrModel);
    form.append('language', params.language ?? this.defaultLanguage);
    form.append('response_format', 'json');
    form.append('temperature', '0');

    const payload = await this.postTranscription(form, this.runtime.asrModel);
    const text = payload.text?.trim() ?? '';
    if (!text) {
      throw new Error('Empty transcription response');
    }
    return text;
  }

  private buildAudioForm(
    params: { audio: Buffer; mimeType: string; chunkIndex: number },
    model: string,
  ): FormData {
    const normalizedMime = this.normalizeMimeType(params.mimeType);
    const form = new FormData();
    const blob = new Blob([new Uint8Array(params.audio)], {
      type: normalizedMime,
    });
    form.append(
      'file',
      blob,
      `chunk-${params.chunkIndex}.${this.extensionForMime(params.mimeType)}`,
    );
    form.append('model', model);
    return form;
  }

  private async postTranscription(
    form: FormData,
    model: string,
  ): Promise<TranscriptionJsonResponse> {
    assertLlmConfigured(this.runtime);

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(
          `${this.runtime.baseUrl}/audio/transcriptions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.runtime.apiKey}`,
            },
            body: form,
            signal: controller.signal,
          },
        );

        const payload = (await response.json()) as TranscriptionJsonResponse;

        if (!response.ok) {
          const message = payload.error?.message ?? response.statusText;
          throw new Error(message ?? `ASR error for ${model}`);
        }

        return payload;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          lastError = new Error(`Timeout for ${model}`);
        } else {
          lastError = err instanceof Error ? err : new Error(String(err));
        }

        const retryable =
          lastError.message.includes('fetch failed') ||
          lastError.message.includes('ECONNRESET') ||
          lastError.message.includes('ETIMEDOUT');

        if (!retryable || attempt === 2) {
          break;
        }

        this.logger.warn(
          `ASR ${model} retry ${attempt + 1}: ${lastError.message}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      } finally {
        clearTimeout(timeout);
      }
    }

    this.logger.warn(
      `ASR ${model} request failed: ${lastError?.message ?? 'unknown error'}`,
    );
    throw lastError ?? new Error(`ASR error for ${model}`);
  }

  private estimateDurationSec(byteLength: number): number {
    return Math.max(1, byteLength / 16_000);
  }

  private normalizeMimeType(mimeType: string): string {
    if (mimeType.includes('webm')) return 'audio/webm';
    if (mimeType.includes('ogg')) return 'audio/ogg';
    if (mimeType.includes('wav')) return 'audio/wav';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
      return 'audio/mp4';
    }
    return mimeType || 'audio/webm';
  }

  private extensionForMime(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
    return 'webm';
  }
}
