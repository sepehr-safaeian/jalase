import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GuardrailBenchResult } from '../types.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior)\s+(rules|instructions)/i,
  /you\s+are\s+now\s+(dan|unrestricted|jailbroken)/i,
  /system\s*prompt\s*:/i,
  /دستورات\s+قبلی\s+را\s+(نادیده|فراموش)/i,
  /دستورالعمل\s+سیستم\s+را\s+لغو/i,
  /از\s+این\s+به\s+بعد\s+بدون\s+محدودیت/i,
];

/** Mirrors API GuardrailsService.detectPromptInjection for offline scoring. */
export function detectPromptInjection(text: string): boolean {
  if (!text.trim()) return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function loadPromptSuite(
  path = join(HERE, '../../data/prompt-injection-suite.json'),
): { injection: string[]; benign: string[] } {
  return JSON.parse(readFileSync(path, 'utf8')) as {
    injection: string[];
    benign: string[];
  };
}

export function runGuardrailBench(
  suite = loadPromptSuite(),
): GuardrailBenchResult {
  const injectionHits = suite.injection.filter((s) =>
    detectPromptInjection(s),
  ).length;
  const benignHits = suite.benign.filter((s) => detectPromptInjection(s)).length;
  return {
    injectionDetectedRate: suite.injection.length
      ? injectionHits / suite.injection.length
      : 0,
    benignFalsePositiveRate: suite.benign.length
      ? benignHits / suite.benign.length
      : 0,
    injectionCount: suite.injection.length,
    benignCount: suite.benign.length,
  };
}
