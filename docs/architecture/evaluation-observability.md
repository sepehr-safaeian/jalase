# Evaluation, Guardrails, Logging & Latency

Architecture plan for measuring and operating Jalase as a **Decision Notebook**:

```text
Meeting → Conversation → Notes → Insight → Decision → Action
```

Quality is not a chatbot score. It is whether the transcript is usable, whether decisions and next actions match the conversation, and whether summaries stay faithful to evidence.

---

## 1. Goals

| Goal | Success signal |
|------|----------------|
| Transcription quality | Low word error rate (WER) on public meeting audio |
| Extraction quality | High precision/recall for decisions and next actions vs human labels |
| Summary faithfulness | High LLM-as-judge score: no invented facts |
| Safe outputs | Guardrails reject filler, weak evidence, and prompt-injection attempts |
| Operability | Structured logs + stage latency (p50/p95) for ASR, review, extract |

Non-goals for v1:

- Full AMI / QMSum download in CI
- Multi-provider A/B leaderboards
- Online human labeling UI

---

## 2. Corpora

### AMI Meeting Corpus (WER)

- Public research corpus of multi-party meetings with reference transcripts
- Used for **ASR / hybrid pipeline** evaluation (WER, optional CER)
- License: follow AMI terms when downloading the full set; repo ships **curated fixtures only**

### QMSum (summary + decisions / actions)

- Query-based multi-domain meeting summarization dataset
- Used for **summary faithfulness** and **decision / next-action extraction** against gold labels
- License: follow QMSum terms for full dumps; repo ships **curated fixtures** under `packages/eval/fixtures/qmsum/`

### Fixture policy

| Mode | Data | When |
|------|------|------|
| CI / default | `packages/eval/fixtures/**` | Always |
| Full offline | External AMI / QMSum paths via env | Local / research machines |
| Published baseline | `packages/eval/results/baseline.json` | README + release notes |

Fixtures are short, English, decision-heavy meetings that exercise the Decision Notebook path. They are **inspired by** AMI / QMSum structure, not redistributed copyrighted audio.

---

## 3. Metrics

### 3.1 WER (Word Error Rate)

1. Normalize reference and hypothesis: lowercase, strip punctuation, collapse whitespace
2. Tokenize on whitespace
3. Compute Levenshtein alignment (substitutions, deletions, insertions)
4. `WER = (S + D + I) / N` where `N` is reference word count

Also report CER (character-level) for diagnostics.

### 3.2 Decision / Action micro-F1

For kinds `decisions` and `next_actions`:

1. Normalize each item text (same rules as WER text normalize)
2. Greedy bipartite match: pair pred↔gold if token Jaccard ≥ `0.5`
3. Micro precision / recall / F1 across the fixture set

Evidence-aware variant (optional in harness): require predicted `evidence` to overlap the transcript (≥60% word overlap), matching runtime guardrails.

### 3.3 Summary faithfulness (LLM-as-judge)

Rubric (score 1–5):

| Score | Meaning |
|-------|---------|
| 5 | Fully supported by transcript; no invented entities or outcomes |
| 4 | Minor omissions; no material hallucination |
| 3 | Mostly faithful; one soft overclaim |
| 2 | Multiple unsupported claims |
| 1 | Largely fabricated or unrelated |

Judge prompt is fixed in `@jalase/eval`. Live judge uses the OpenAI-compatible chat API (`AVALAI_*`). If no API key is present, the harness reads cached scores from `baseline.json`.

---

## 4. Offline harness (`@jalase/eval`)

```text
packages/eval/
  src/metrics/          WER, extraction F1, faithfulness judge
  src/loaders/          AMI / QMSum fixture loaders
  fixtures/ami|qmsum/   Curated JSON fixtures
  results/baseline.json Published numbers for README
  src/run-baseline.ts   CLI entry
```

Commands (repo root):

```bash
npm run eval:baseline
npm run eval:wer
npm run eval:extractions
npm run eval:faithfulness
```

Regenerate README tables from CLI markdown output after intentional metric changes. Commit updated `baseline.json` in the same PR.

---

## 5. Guardrail layers

Runtime module: `apps/api/src/ai/guardrails/`

| Layer | Responsibility |
|-------|----------------|
| Input sufficiency | `assessTranscriptSufficiency` before calling the LLM |
| Output validation | evidence overlap, confidence ≥ 0.75, filler rejection, max items |
| Prompt injection | Detect “ignore previous instructions” style patterns (EN/FA) |
| Log redaction | Mask email / phone before structured logs |

Feature flag: `ai.guardrails` (default on for personal / team / enterprise tiers that already unlock insights).

Guardrails must stay **conservative**: empty honest sections beat padded lists.

---

## 6. Observability

### Log schema (pipeline stages)

```json
{
  "msg": "pipeline.stage",
  "requestId": "uuid",
  "noteId": "uuid",
  "stage": "asr|review|extract",
  "kind": "summary|decisions|next_actions|highlights",
  "durationMs": 1234,
  "outcome": "ok|empty|error|guardrail_reject",
  "counts": { "turns": 12, "items": 3 }
}
```

### HTTP latency

Global interceptor logs `method`, `path`, `statusCode`, `durationMs`, `requestId`.

### Metrics endpoint

`GET /api/v1/health/metrics` when `METRICS_ENABLED=true` or `NODE_ENV=development`.

In-memory aggregates: count, sum, approximate p50 / p95 per stage.

### Suggested SLOs (personal tier, single-region)

| Stage | p50 | p95 |
|-------|-----|-----|
| HTTP API (non-AI) | < 100 ms | < 500 ms |
| Extract (LLM) | < 8 s | < 30 s |
| Finalize ASR + review | < 45 s (5 min audio) | < 120 s |

Tune after collecting production samples; fixtures alone are not SLO proof.

### Env

| Key | Purpose |
|-----|---------|
| `LOG_LEVEL` | `info` / `debug` / … |
| `LOG_PRETTY` | human-readable logs in local dev |
| `METRICS_ENABLED` | expose `/health/metrics` outside development |

---

## 7. CI vs research

| Check | CI | Research machine |
|-------|----|------------------|
| Unit tests for scorers | Yes | Yes |
| Fixture baseline (no live LLM) | Yes | Yes |
| Live faithfulness judge | No (cached) | Optional with API key |
| Full AMI / QMSum | No | Optional |

---

## 8. Limitations

- Public fixtures are English; product also supports Persian. Track FA quality with internal meetings separately.
- Fixture sample size is small by design (CI speed + licensing). Treat README numbers as **published baseline**, not a leaderboard claim over the entire AMI / QMSum corpora.
- LLM-as-judge variance: pin model id in `baseline.json` metadata when regenerating live scores.

---

## 9. Related docs

- [Evaluation harness](../features/evaluation-harness.md)
- [Observability](../features/observability.md)
- [AI guardrails](../features/ai-guardrails.md)
- [Hybrid transcription pipeline](../features/hybrid-transcription-pipeline.md)
- [Meeting insights](../features/meeting-insights.md)
