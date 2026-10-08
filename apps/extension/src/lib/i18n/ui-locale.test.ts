import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDir, getUiLocale } from './ui-locale';

describe('getUiLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps Persian browser locales to fa', () => {
    vi.stubGlobal('browser', {
      i18n: { getUILanguage: () => 'fa-IR' },
    });
    expect(getUiLocale()).toBe('fa');
  });

  it('defaults to en for other locales', () => {
    vi.stubGlobal('browser', {
      i18n: { getUILanguage: () => 'en-US' },
    });
    expect(getUiLocale()).toBe('en');
  });
});

describe('getDir', () => {
  it('returns rtl for fa and ltr for en', () => {
    expect(getDir('fa')).toBe('rtl');
    expect(getDir('en')).toBe('ltr');
  });
});
