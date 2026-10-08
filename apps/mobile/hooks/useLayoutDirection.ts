import { useMemo } from 'react';
import { useSettings } from '@/theme/ThemeProvider';

/**
 * Layout helpers driven by the app locale, not by the native I18nManager state.
 *
 * Screens set an explicit `direction` style (see `Screen`), so plain
 * `flexDirection: 'row'` and `alignItems: 'flex-start'` already follow the
 * locale. Never combine these with `row-reverse` based on `isRtl`.
 */
export function useLayoutDirection() {
  const { isRtl } = useSettings();

  return useMemo(
    () => ({
      isRtl,
      /** Apply on a screen or card root so descendants lay out per locale */
      direction: (isRtl ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
      /** Physical text alignment for the reading start edge */
      textAlign: (isRtl ? 'right' : 'left') as 'right' | 'left',
    }),
    [isRtl],
  );
}
