const FONT_FILES = [
  { weight: 400, file: 'Vazirmatn-Regular.ttf' },
  { weight: 500, file: 'Vazirmatn-Medium.ttf' },
  { weight: 600, file: 'Vazirmatn-SemiBold.ttf' },
  { weight: 700, file: 'Vazirmatn-Bold.ttf' },
] as const;

/** @font-face با URL مطلق افزونه برای Shadow DOM روی صفحات خارجی */
export function getExtensionFontFaceCss(): string {
  return FONT_FILES.map(({ weight, file }) => {
    const url = browser.runtime.getURL(`/fonts/${file}`);
    return `
      @font-face {
        font-family: 'Vazirmatn';
        src: url('${url}') format('truetype');
        font-weight: ${weight};
        font-style: normal;
        font-display: block;
      }
    `;
  }).join('\n');
}
