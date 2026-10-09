# Evaluation, Guardrails, Logging & Latency

Jalase is scored as a **Decision Notebook**:

```text
Meeting → Conversation → Notes → Insight → Decision → Action
```

## Honest metrics rule

README numbers must come from `packages/eval/runs/<run-id>/` system outputs with git SHA and model names. Synthetic fixtures are unit tests only.

## Flow

```text
eval:fetch-ami → packages/eval/.data/ (git-ignored)
eval:run       → packages/eval/runs/<run-id>/ (commit text)
eval:score     → results/baseline.json + baseline.md + failures.md
```

## Metrics

| Suite | Input | Metric |
|-------|-------|--------|
| ASR | AMI reference vs Jalase cleaned transcript | Weighted WER / CER |
| Decisions / actions | Gold AMI abstractive sections vs Jalase items | Micro-F1 (Jaccard ≥ 0.5), on AMI ref path and ASR path |
| Faithfulness | Jalase summary vs transcript | Supported rate (primary), mean 1–5 (secondary) |
| Guardrails | 40 injection + 40 benign strings | Detection rate / false-positive rate |

## Observability

Structured `pipeline.stage` logs, `x-request-id`, `/api/v1/health/metrics`.

## Provider config

`LLM_API_KEY`, `LLM_BASE_URL` (required, no hard-coded default), `ASR_MODEL`, `DIARIZE_MODEL`, `EXTRACT_MODEL`, `REFINE_MODEL`, `JUDGE_MODEL`. Deprecated `AVALAI_*` fallbacks for one release.

## Related

- [Evaluation harness](../features/evaluation-harness.md)
- [Observability](../features/observability.md)
- [AI guardrails](../features/ai-guardrails.md)
