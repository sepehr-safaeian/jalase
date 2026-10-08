import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  outDir: '.output',
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    version: '0.1.0',
    default_locale: 'en',
    permissions: ['storage', 'activeTab', 'tabCapture', 'offscreen', 'notifications'],
    host_permissions: ['https://meet.google.com/*'],
    web_accessible_resources: [
      {
        resources: ['fonts/*.ttf'],
        matches: ['https://meet.google.com/*'],
      },
    ],
    action: {
      default_title: '__MSG_extDefaultTitle__',
    },
    icons: {
      16: 'icon/icon.svg',
      32: 'icon/icon.svg',
      48: 'icon/icon.svg',
      128: 'icon/icon.svg',
    },
    browser_specific_settings: {
      gecko: {
        id: 'goosha@goosha.app',
        strict_min_version: '109.0',
      },
    },
  },
  webExt: {
    startUrls: ['https://meet.google.com/'],
  },
  suppressWarnings: {
    firefoxDataCollection: true,
  },
});
