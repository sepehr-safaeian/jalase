import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { QmSumFixture } from '../types.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_FIXTURES_DIR = join(HERE, '../../fixtures/qmsum');

export function loadQmSumFixtures(dir = DEFAULT_FIXTURES_DIR): QmSumFixture[] {
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort();
  return files.map((name) => {
    const raw = readFileSync(join(dir, name), 'utf8');
    return JSON.parse(raw) as QmSumFixture;
  });
}
