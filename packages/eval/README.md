# `@jalase/eval`

Offline evaluation harness for Jalase.

## What it measures

| Suite | Corpus style | Metric |
|-------|--------------|--------|
| WER | AMI fixtures | Word / character error rate |
| Extractions | QMSum fixtures | Decision & next-action micro-F1 |
| Faithfulness | QMSum fixtures | LLM-as-judge (1–5) with cached fallback |

## Commands

From the monorepo root:

```bash
npm run eval:baseline
npm run eval:wer
npm run eval:extractions
npm run eval:faithfulness
```

Or inside this package:

```bash
npm run eval:baseline --workspace=@jalase/eval
```

`eval:baseline` writes [`results/baseline.json`](./results/baseline.json).

## Live judge

Set `AVALAI_API_KEY` (and optional `AVALAI_BASE_URL` / `AVALAI_EXTRACT_MODEL`) to refresh faithfulness live. Without a key, fixtures use `cachedFaithfulness` then a token-overlap heuristic.

## License note

Fixtures are short, curated, AMI/QMSum-**style** meetings for CI. They are not a redistribution of the full corpora. Download official AMI / QMSum dumps separately for research-scale runs.
