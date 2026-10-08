import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { fontAssets } from './font-assets';

let injected = false;

/**
 * ProseMirror/Tiptap DOM از expo-font ارث نمی‌برد؛ @font-face را برای وب inject می‌کنیم.
 */
export function injectWebFonts(): void {
  if (Platform.OS !== 'web' || injected || typeof document === 'undefined') {
    return;
  }

  injected = true;

  const rules = Object.entries(fontAssets).map(([family, moduleId]) => {
    const uri = Asset.fromModule(moduleId).uri;
    return `@font-face{font-family:'${family}';src:url('${uri}') format('truetype');font-style:normal;font-display:swap;}`;
  });

  const style = document.createElement('style');
  style.setAttribute('data-jalase-fonts', 'true');
  style.textContent = rules.join('');
  document.head.appendChild(style);
}
