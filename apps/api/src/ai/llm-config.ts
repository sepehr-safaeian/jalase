import type { ConfigService } from '@nestjs/config';

/**
 * Provider-neutral LLM / ASR configuration.
 * New names are preferred; AVALAI_* remains a deprecated fallback for one release.
 */
export interface LlmRuntimeConfig {
  apiKey: string;
  baseUrl: string;
  diarizeModel: string;
  asrModel: string;
  refineModel: string;
  extractModel: string;
  judgeModel: string;
  refineEnabled: boolean;
  extractEnabled: boolean;
  hybridPipeline: boolean;
  liveDiarize: boolean;
}

function firstNonEmpty(
  config: ConfigService,
  keys: string[],
  fallback = '',
): string {
  for (const key of keys) {
    const value = config.get<string>(key)?.trim();
    if (value) return value;
  }
  return fallback;
}

function flag(
  config: ConfigService,
  keys: string[],
  defaultValue: boolean,
): boolean {
  for (const key of keys) {
    const raw = config.get<string>(key);
    if (raw === undefined || raw === null || raw === '') continue;
    return raw !== 'false';
  }
  return defaultValue;
}

export function resolveLlmRuntimeConfig(config: ConfigService): LlmRuntimeConfig {
  return {
    apiKey: firstNonEmpty(config, ['LLM_API_KEY', 'AVALAI_API_KEY']),
    baseUrl: firstNonEmpty(config, ['LLM_BASE_URL', 'AVALAI_BASE_URL']),
    diarizeModel: firstNonEmpty(
      config,
      ['DIARIZE_MODEL', 'AVALAI_DIARIZE_MODEL'],
      'gpt-4o-transcribe-diarize',
    ),
    asrModel: firstNonEmpty(
      config,
      ['ASR_MODEL', 'AVALAI_TRANSCRIBE_MODEL'],
      'whisper-large-v3',
    ),
    refineModel: firstNonEmpty(
      config,
      ['REFINE_MODEL', 'AVALAI_REFINE_MODEL'],
      'gpt-4o-mini',
    ),
    extractModel: firstNonEmpty(
      config,
      ['EXTRACT_MODEL', 'AVALAI_EXTRACT_MODEL'],
      'gpt-4o-mini',
    ),
    judgeModel: firstNonEmpty(
      config,
      ['JUDGE_MODEL', 'EXTRACT_MODEL', 'AVALAI_EXTRACT_MODEL'],
      'gpt-4o-mini',
    ),
    refineEnabled: flag(config, ['REFINE_ENABLED', 'AVALAI_REFINE_ENABLED'], true),
    extractEnabled: flag(
      config,
      ['EXTRACT_ENABLED', 'AVALAI_EXTRACT_ENABLED'],
      true,
    ),
    hybridPipeline: flag(
      config,
      ['HYBRID_PIPELINE', 'AVALAI_HYBRID_PIPELINE'],
      true,
    ),
    liveDiarize: flag(config, ['LIVE_DIARIZE', 'AVALAI_LIVE_DIARIZE'], false),
  };
}

export function assertLlmConfigured(runtime: LlmRuntimeConfig): void {
  if (!runtime.apiKey) {
    throw new Error(
      'LLM_API_KEY is not configured (deprecated fallback: AVALAI_API_KEY)',
    );
  }
  if (!runtime.baseUrl) {
    throw new Error(
      'LLM_BASE_URL is not configured. Set an OpenAI-compatible base URL (e.g. https://api.openai.com/v1, a vLLM/Ollama OpenAI endpoint, or any compatible gateway). Deprecated fallback: AVALAI_BASE_URL.',
    );
  }
}
