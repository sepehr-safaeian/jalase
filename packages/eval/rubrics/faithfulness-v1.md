# Faithfulness rubric v1

Judge each summary item against the transcript only.

Score 1–5 per item (or the set mean as a secondary metric):

| Score | Meaning |
|-------|---------|
| 5 | Fully supported; no invented entities or outcomes |
| 4 | Minor omissions only; no material hallucination |
| 3 | Mostly faithful with one soft overclaim |
| 2 | Multiple unsupported claims |
| 1 | Largely fabricated or unrelated |

Primary metric for reporting: **share of items with score ≥ 4** (supported rate).

Respond with JSON only:

```json
{ "items": [{ "text": "...", "score": 1, "supported": true, "rationale": "..." }], "meanScore": 1.0 }
```

Use a judge model from a different family than the generator when possible. Temperature must be 0.
