import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AmiFixture } from '../types.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_FIXTURES_DIR = join(HERE, '../../fixtures/ami');

export function loadAmiFixtures(dir = DEFAULT_FIXTURES_DIR): AmiFixture[] {
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort();
  return files.map((name) => {
    const raw = readFileSync(join(dir, name), 'utf8');
    return JSON.parse(raw) as AmiFixture;
  });
}
