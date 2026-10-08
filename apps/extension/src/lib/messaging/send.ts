import { t } from '@/lib/i18n/ui-strings';
import type { BackgroundRequest, BackgroundResponse } from './types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isMissingReceiver(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Receiving end does not exist') ||
    message.includes('Could not establish connection') ||
    message.includes('Extension context invalidated') ||
    message.includes('message port closed')
  );
}

function isRuntimeAvailable(): boolean {
  try {
    return Boolean(browser.runtime?.id);
  } catch {
    return false;
  }
}

export async function sendToBackground(
  message: BackgroundRequest,
  options?: { retries?: number; retryDelayMs?: number },
): Promise<BackgroundResponse> {
  if (!isRuntimeAvailable()) {
    return { ok: false, error: t('extensionUnavailable') };
  }

  const retries = options?.retries ?? 2;
  const retryDelayMs = options?.retryDelayMs ?? 200;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await browser.runtime.sendMessage(message);
      if (response !== undefined) {
        return response as BackgroundResponse;
      }
    } catch (error) {
      if (!isMissingReceiver(error)) {
        throw error;
      }

      if (attempt === retries) {
        return { ok: false, error: t('extensionUnavailable') };
      }
    }

    await delay(retryDelayMs * (attempt + 1));
  }

  return { ok: false, error: t('extensionUnavailable') };
}

export function onBackgroundBroadcast(
  handler: (message: unknown) => void,
): () => void {
  const listener = (message: unknown) => {
    handler(message);
  };
  browser.runtime.onMessage.addListener(listener);
  return () => browser.runtime.onMessage.removeListener(listener);
}
