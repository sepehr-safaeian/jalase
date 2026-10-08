import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  MeetingExtractionKind,
  ParsedExtractionResult,
  Tier,
  TranscriptSufficiencyResult,
} from '@jalase/shared';
import {
  assessTranscriptSufficiency,
  isFeatureEnabled,
  normalizeTier,
  validateExtractionCandidates,
} from '@jalase/shared';

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior)\s+(rules|instructions)/i,
  /you\s+are\s+now\s+(dan|unrestricted|jailbroken)/i,
  /system\s*prompt\s*:/i,
  /دستورات\s+قبلی\s+را\s+(نادیده|فراموش)/i,
  /دستورالعمل\s+سیستم\s+را\s+لغو/i,
  /از\s+این\s+به\s+بعد\s+بدون\s+محدودیت/i,
];

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;

export interface GuardrailFilterResult {
  items: string[];
  sufficiency: TranscriptSufficiencyResult;
  injectionDetected: boolean;
  rejectedByGuardrail: boolean;
}

@Injectable()
export class GuardrailsService {
  private readonly logger = new Logger(GuardrailsService.name);
  private readonly defaultTier: Tier;
  private readonly isDev: boolean;

  constructor(config: ConfigService) {
    this.defaultTier = normalizeTier(
      config.get<string>('DEFAULT_TIER', 'plus'),
    );
    this.isDev = config.get<string>('NODE_ENV', 'development') === 'development';
  }

  isEnabled(tier: Tier = this.defaultTier): boolean {
    return isFeatureEnabled('ai.guardrails', {
      tier,
      isDev: this.isDev,
    });
  }

  assertTranscriptReady(
    kind: MeetingExtractionKind,
    transcript: string,
  ): TranscriptSufficiencyResult {
    return assessTranscriptSufficiency(kind, transcript);
  }

  filterExtraction(
    kind: MeetingExtractionKind,
    parsed: ParsedExtractionResult,
    transcript: string,
  ): string[] {
    return validateExtractionCandidates(parsed.items, transcript, kind);
  }

  detectPromptInjection(text: string): boolean {
    if (!text.trim()) return false;
    return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
  }

  redactForLogs(value: string): string {
    return value
      .replace(EMAIL_RE, '[redacted-email]')
      .replace(PHONE_RE, '[redacted-phone]');
  }

  redactPayload<T>(payload: T): T {
    if (typeof payload === 'string') {
      return this.redactForLogs(payload) as T;
    }
    if (Array.isArray(payload)) {
      return payload.map((item) => this.redactPayload(item)) as T;
    }
    if (payload && typeof payload === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(payload)) {
        out[key] = this.redactPayload(val);
      }
      return out as T;
    }
    return payload;
  }

  evaluateExtraction(options: {
    kind: MeetingExtractionKind;
    transcript: string;
    parsed?: ParsedExtractionResult;
    tier?: Tier;
  }): GuardrailFilterResult {
    const enabled = this.isEnabled(options.tier);
    const sufficiency = this.assertTranscriptReady(
      options.kind,
      options.transcript,
    );
    const injectionDetected = enabled
      ? this.detectPromptInjection(options.transcript)
      : false;

    if (!sufficiency.sufficient) {
      if (enabled) {
        this.logger.log(
          JSON.stringify({
            msg: 'guardrail.outcome',
            stage: 'extract',
            kind: options.kind,
            outcome: 'empty',
            reason: 'insufficient_transcript',
          }),
        );
      }
      return {
        items: [],
        sufficiency,
        injectionDetected,
        rejectedByGuardrail: false,
      };
    }

    if (injectionDetected) {
      this.logger.warn(
        JSON.stringify({
          msg: 'guardrail.outcome',
          stage: 'extract',
          kind: options.kind,
          outcome: 'guardrail_reject',
          reason: 'prompt_injection',
        }),
      );
      return {
        items: [],
        sufficiency,
        injectionDetected: true,
        rejectedByGuardrail: true,
      };
    }

    const items = options.parsed
      ? this.filterExtraction(options.kind, options.parsed, options.transcript)
      : [];

    if (enabled) {
      this.logger.log(
        JSON.stringify({
          msg: 'guardrail.outcome',
          stage: 'extract',
          kind: options.kind,
          outcome: items.length ? 'ok' : 'empty',
          counts: { items: items.length },
        }),
      );
    }

    return {
      items,
      sufficiency,
      injectionDetected: false,
      rejectedByGuardrail: false,
    };
  }
}
