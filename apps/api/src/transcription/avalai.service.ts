/**
 * @deprecated Import from `./openai-compatible.client.js` instead.
 * Kept as a thin re-export so existing relative imports keep typechecking during the rename.
 */
export {
  OpenAiCompatibleClient,
  OpenAiCompatibleClient as AvalAiService,
  type DiarizedSegment,
  type DiarizationResult,
} from './openai-compatible.client.js';
