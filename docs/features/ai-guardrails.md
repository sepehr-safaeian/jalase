# AI guardrails

## Summary

Central `GuardrailsService` wraps transcript sufficiency, extraction validation, prompt-injection detection, and log PII redaction for meeting AI paths.

## Feature flag

| Key | Min tier | Default |
|-----|----------|---------|
| `ai.guardrails` | `plus` | on (`enabledInDev: true`) |

When the flag is off, extraction still runs shared validators for safety; injection soft-checks and extra structured `guardrail.outcome` logs are skipped.

## Layers

1. **Sufficiency** – short transcripts skip the LLM (`assessTranscriptSufficiency`)
2. **Validation** – evidence overlap ≥ 60%, confidence ≥ 0.75, filler filters, max items
3. **Injection** – EN/FA patterns that try to override system instructions
4. **Redaction** – mask email / Iranian or international phone shapes in log payloads

## API touchpoints

- `MeetingExtractionService` – primary consumer
- `TranscriptionService` finalize – structured stage logs; redaction for error context

## Tests

- `apps/api/src/ai/guardrails/guardrails.service.spec.ts`
- Existing extraction specs remain the behavioral contract for empty / evidence paths
