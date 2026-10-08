export type AiLocale = 'en' | 'fa';

export function resolveAiLocale(
  value?: string | null,
  fallback: AiLocale = 'en',
): AiLocale {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('fa') || normalized.startsWith('per')) {
    return 'fa';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }
  return fallback;
}

export function resolveTranscribeLanguage(
  locale: AiLocale,
  envOverride?: string | null,
): string {
  if (envOverride?.trim()) {
    return envOverride.trim().toLowerCase();
  }
  return locale === 'fa' ? 'fa' : 'en';
}
