import type { ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getExtensionFontFaceCss } from '@/lib/fonts/extension-font-face';
import { getDir } from '@/lib/i18n/ui-locale';

const HOST_ID = 'goosha-extension-host';
const HOST_ROOT_KEY = '__gooshaReactRoot';

export interface ShadowMount {
  root: Root;
  shadow: ShadowRoot;
  host: HTMLElement;
  unmount: () => void;
}

function styleOverlayHost(host: HTMLElement) {
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '100vw';
  host.style.height = '100vh';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none';
  host.style.overflow = 'visible';
  host.style.margin = '0';
  host.style.padding = '0';
  host.style.border = 'none';
}

export function mountShadowUi(children: ReactNode): ShadowMount {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    styleOverlayHost(host);
    (document.documentElement ?? document.body).appendChild(host);
  } else {
    styleOverlayHost(host);
  }

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

  let mountPoint = shadow.querySelector('[data-goosha-mount]') as HTMLElement | null;
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.setAttribute('data-goosha-mount', 'true');
    mountPoint.className = 'goosha-root';

    const style = document.createElement('style');
    style.textContent = getInjectedBaseStyles();
    shadow.appendChild(style);
    shadow.appendChild(mountPoint);
  }
  mountPoint.dir = getDir();

  const hostWithRoot = host as HTMLElement & { [HOST_ROOT_KEY]?: Root };
  let root = hostWithRoot[HOST_ROOT_KEY];
  if (!root) {
    root = createRoot(mountPoint);
    hostWithRoot[HOST_ROOT_KEY] = root;
  }
  root.render(children);

  return {
    root,
    shadow,
    host,
    unmount: () => {
      root.unmount();
      host?.remove();
    },
  };
}

function getInjectedBaseStyles(): string {
  return `
    ${getExtensionFontFaceCss()}

    :host, .goosha-root {
      --canvas: #f7f7f2;
      --surface: #ffffff;
      --ink: #0e0f0c;
      --ink-soft: #454745;
      --ink-muted: #72726e;
      --ink-quiet: #818179;
      --green-900: #187a45;
      --green-100: #d9f5e6;
      --border: #e3e3e3;
      --error: #b42318;
      --font-ui: 'Vazirmatn', sans-serif;
      --radius-lg: 12px;
      --radius-pill: 9999px;
      --shadow-overlay: 0 8px 32px rgba(14, 15, 12, 0.12);
    }

    .goosha-root {
      all: initial;
      font-family: var(--font-ui);
      color: var(--ink);
      pointer-events: none;
    }

    .goosha-root[dir="rtl"] { direction: rtl; }
    .goosha-root[dir="ltr"] { direction: ltr; }

    .goosha-root :is(h1, h2, h3, h4, h5, h6, p, span, label, button, input) {
      font-family: var(--font-ui);
    }

    .goosha-root *, .goosha-root *::before, .goosha-root *::after {
      box-sizing: border-box;
    }

    .goosha-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: var(--radius-pill);
      font-family: var(--font-ui);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }

    .goosha-btn:active:not(:disabled) { transform: scale(0.97); }
    .goosha-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .goosha-btn-primary { background: var(--green-900); color: #fff; }
    .goosha-btn-secondary { background: var(--surface); color: var(--ink); border-color: var(--border); }
    .goosha-text-error { color: var(--error); }

    @media (prefers-reduced-motion: reduce) {
      .goosha-btn { transition: none; }
    }
  `;
}
