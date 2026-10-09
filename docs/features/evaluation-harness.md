# Evaluation harness

## Summary

Offline scoring of **Jalase production outputs** on AMI Meeting Corpus meetings. Synthetic fixtures under `packages/eval/test/fixtures/synthetic/` are unit tests only and never appear in README metrics.

## Commands

```bash
npm run eval:fetch-ami              # AMI annotations + Mix-Headset → packages/eval/.data/
npm run eval:run                    # production ASR + extraction → packages/eval/runs/<id>/
npm run eval:score -- --run <id>    # offline metrics → results/baseline.json
npm run eval:score -- --run latest --check
```

## Pipeline

1. `apps/api/scripts/eval-run.ts` boots Nest and calls `HybridTranscriptionPipeline` + `MeetingExtractionService.extractFromTranscript`
2. Run folder stores raw ASR, cleaned transcript, decisions, next actions, summary, latency
3. `eval:score` compares against AMI gold (manual words + abstractive DECISIONS/ACTIONS)

## Corpus

AMI Meeting Corpus, CC BY 4.0. Carletta et al. (2005). List: `packages/eval/data/ami-meetings.json`.

## Security

- Never commit `packages/eval/.data/` (audio)
- Run manifests may be committed (text only)
- Live judge needs `LLM_API_KEY` + `LLM_BASE_URL`; scoring does not
