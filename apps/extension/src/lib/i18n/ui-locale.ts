export type UiLocale = 'en' | 'fa';

export type TextDirection = 'ltr' | 'rtl';

/** Maps browser UI language to supported extension locales (en default). */
export function getUiLocale(): UiLocale {
  try {
    const raw = browser.i18n.getUILanguage().toLowerCase();
    if (raw.startsWith('fa') || raw.startsWith('per')) {
      return 'fa';
    }
  } catch {
    /* popup/content without i18n */
  }
  return 'en';
}

export function getDir(locale: UiLocale = getUiLocale()): TextDirection {
  return locale === 'fa' ? 'rtl' : 'ltr';
}

/** Apply lang/dir on a document root (popup HTML). */
export function applyDocumentLocale(doc: Document = document): void {
  const locale = getUiLocale();
  const dir = getDir(locale);
  doc.documentElement.lang = locale;
  doc.documentElement.dir = dir;
}
