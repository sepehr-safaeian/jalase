# Evaluation harness

## Summary

Offline quality suite in `@jalase/eval` for transcription WER (AMI-style fixtures), decision / next-action F1 (QMSum-style fixtures), and summary faithfulness via LLM-as-judge with cached baseline fallback.

## Commands

```bash
npm run eval:baseline       # full report → results/baseline.json
npm run eval:wer            # ASR WER only
npm run eval:extractions    # decisions + next_actions F1
npm run eval:faithfulness   # summary judge (live or cached)
```

## Feature flag

N/A (offline package). Runtime quality gates use `ai.guardrails`.

## Layout

| Path | Role |
|------|------|
| `packages/eval/fixtures/ami/` | Reference + hypothesis transcripts for WER |
| `packages/eval/fixtures/qmsum/` | Gold summary / decisions / actions |
| `packages/eval/results/baseline.json` | Published numbers for README |
| `packages/eval/src/metrics/` | Scorers |

## Security

- Fixtures contain no real user data
- Live judge uses `AVALAI_API_KEY` only when present; never required for CI
- Do not commit provider responses that include secrets
