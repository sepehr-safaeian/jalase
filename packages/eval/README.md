# `@jalase/eval`

Scores **Jalase system outputs**, not hand-written fixture predictions.

## Flow

1. `npm run eval:fetch-ami` – download AMI annotations + Mix-Headset audio into `.data/` (git-ignored)
2. `npm run eval:run` – run production ASR + extraction (`apps/api/scripts/eval-run.ts`); writes `runs/<run-id>/`
3. `npm run eval:score -- --run <run-id>` – offline metrics → `results/baseline.json` (no API keys)

Synthetic fixtures under `test/fixtures/synthetic/` are **unit tests only**.

## Corpus

AMI Meeting Corpus, CC BY 4.0. Carletta et al. (2005), *The AMI Meeting Corpus: A Pre-announcement*.

Meeting list: [`data/ami-meetings.json`](./data/ami-meetings.json).
