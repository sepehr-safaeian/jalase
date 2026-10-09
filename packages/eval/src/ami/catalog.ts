import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AmiCatalog } from '../types.js';

const HERE = dirname(fileURLToPath(import.meta.url));

export function loadAmiCatalog(
  path = join(HERE, '../../data/ami-meetings.json'),
): AmiCatalog {
  return JSON.parse(readFileSync(path, 'utf8')) as AmiCatalog;
}

export function dataRoot(
  override = process.env.JALASE_EVAL_DATA,
): string {
  return override?.trim() || join(HERE, '../../.data');
}
