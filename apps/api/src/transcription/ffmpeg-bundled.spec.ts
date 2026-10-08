import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

describe('bundled ffmpeg', () => {
  it('is installed with the API package', () => {
    const installer = require('@ffmpeg-installer/ffmpeg') as { path: string };
    expect(installer.path).toBeTruthy();
    expect(existsSync(installer.path)).toBe(true);
  });
});
