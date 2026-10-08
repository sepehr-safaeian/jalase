# استخراج هوشمند جلسه

## خلاصه

برای جلسات **ضبط‌شده** (بدون ضبط مجدد)، FAB آیکونی ⚡ باز می‌کند sheet با ۴ گزینه:

| kind | UI | بخش یادداشت |
|------|-----|-------------|
| `summary` | خلاصه جلسه | ## خلاصه |
| `decisions` | تصمیم‌ها | ## تصمیم‌ها |
| `next_actions` | کارهای بعدی | ## کارهای بعدی (task list) |
| `highlights` | نکات مهم | ## نکات مهم |

**هر kind فقط یک‌بار** per note (`ai_extractions_json`).

## فلسفه: محافظه‌کارانه، نه پرکردن لیست

استخراج هوشمند عمداً **محتاط** است:

- اگر رونوشت کوتاه یا بی‌محتواست، LLM صدا زده نمی‌شود
- اگر تصمیم/اقدام/نکته قطعی نیست، بخش با پیام صادقانه پر می‌شود (نه bullet خالی)
- هر آیتم باید `evidence` از رونوشت + `confidence >= 0.75` داشته باشد
- عبارات کلی و filler رد می‌شوند

### پیام‌های حالت خالی

| kind | پیام پیش‌فرض |
|------|-------------|
| `summary` | محتوای کافی برای خلاصه‌سازی وجود ندارد. |
| `decisions` | در این جلسه تصمیم قطعی ثبت نشده است. |
| `next_actions` | اقدام مشخصی از این جلسه استخراج نشد. |
| `highlights` | نکته مهمی برای ثبت پیدا نشد. |

## Pipeline

```
رونوشت + kind
  → assessTranscriptSufficiency (fast-path برای رونوشت خیلی کوتاه)
  → LLM JSON: { has_items, empty_reason, items[{text, evidence, confidence}] }
  → validateExtractionCandidates (evidence + confidence + anti-filler)
  → syncNoteSection (لیست یا پاراگراف حالت خالی)
  → mark extraction used
```

## API

`POST /api/v1/notes/:id/extractions/:kind`

- نیاز به رونوشت
- LLM: AvalAI (`AVALAI_EXTRACT_MODEL`, پیش‌فرض `qwen3.5-flash`)
- temperature: `0.05`
- timeout تطبیقی: ۳۰s / ۶۰s / ۹۰s بر اساس طول رونوشت
- خروجی در `contentJson` با `syncNoteSection`
- **حالت خالی خطا نیست**؛ extraction همچنان used می‌شود

## DB

`notes.ai_extractions_json`: `{ "summary": "2026-08-31T..." }`

## Feature flag

`meeting.insights`

## UI

- `MeetingInsightFab`: دایره لوکس، آیکون zap، halo زرد subtle
- `MeetingInsightSheet`: کارت‌های formal با badge «انجام شد»
- کلاینت: timeout ۱۲۰s برای درخواست استخراج

## تست

- `packages/shared/src/notes/meeting-extractions.spec.ts`
- `apps/api/src/notes/meeting-extraction.service.spec.ts`
