import type { MeetingExtractionKind } from '@jalase/shared';
import type { AiLocale } from './prompt-locale.js';

const JSON_SCHEMA_EN = `{
  "has_items": boolean,
  "empty_reason": "short English message when there is nothing to record",
  "items": [
    {
      "text": "short English sentence",
      "evidence": "quote or close paraphrase from the transcript",
      "confidence": 0.0
    }
  ]
}`;

const JSON_SCHEMA_FA = `{
  "has_items": boolean,
  "empty_reason": "پیام فارسی کوتاه وقتی چیزی برای ثبت نیست",
  "items": [
    {
      "text": "جمله کوتاه فارسی",
      "evidence": "نقل‌قول یا بازنویسی نزدیک از رونوشت",
      "confidence": 0.0
    }
  ]
}`;

const REVIEW_SYSTEM_EN = `You are a careful meeting transcript editor. The input is ASR (speech-to-text) output.

Your role: fix clear hearing and spelling mistakes, not rewrite sentences.

Allowed:
- Fix misheard words using meeting context
- Fix spelling and punctuation
- Fix tool/product names when clear from context
- Complete clearly truncated words in the same sentence
- Keep correct English technical terms: API, Teams, Meet, timestamp, webhook

Not allowed:
- Summarizing or deleting real speaker content
- Adding information that is not in the text
- Changing sentence meaning
- Removing genuine filler words
- Inventing entirely new sentences

If a sentence is incomprehensible and cannot be reconstructed, fix what you can without guessing.

Output valid JSON only:
{
  "turns": [
    { "id": "same input id", "text": "corrected text" }
  ]
}`;

const REVIEW_SYSTEM_FA = `تو ویراستار رونوشت جلسه فارسی هستی. ورودی خروجی ASR (تبدیل گفتار به متن) است.

نقش تو: اصلاح خطاهای واضح شنیداری و املایی، نه بازنویسی جمله.

مجاز:
- اصلاح واژه‌های غلط شنیده‌شده با شواهد زمینه جلسه
- اصلاح املای فارسی و نیم‌فاصله
- اصلاح نام ابزارها و اصطلاحات فنی اگر از context جلسه مشخص است
- تکمیل واژه‌های ناقص واضح در همان جمله
- حفظ کلمات انگلیسی فنی درست: API, Teams, Meet, timestamp, webhook

غیرمجاز:
- خلاصه‌کردن یا حذف محتوای واقعی گوینده
- اضافه‌کردن اطلاعاتی که در متن نیست
- تغییر معنای جمله
- حذف filler words واقعی
- ساختن جمله کاملاً جدید بدون پشتوانه

اگر یک جمله کاملاً نامفهوم است و با context هم قابل بازسازی نیست، همان را تا حد ممکن اصلاح کن ولی حدس نزن.

خروجی فقط JSON معتبر:
{
  "turns": [
    { "id": "همان id ورودی", "text": "متن اصلاح‌شده" }
  ]
}`;

function extractionPrompts(
  locale: AiLocale,
): Record<MeetingExtractionKind, string> {
  const schema = locale === 'fa' ? JSON_SCHEMA_FA : JSON_SCHEMA_EN;

  if (locale === 'fa') {
    return {
      summary: `تو منشی محتاط جلسات فارسی هستی. فقط وقتی خلاصه معنادار داری، bullet بنویس.

قوانین سخت:
- اگر رونوشت خیلی کوتاه یا بی‌محتواست، has_items=false
- هرگز برای پر کردن لیست حدس نزن
- حداکثر ۵ bullet، هر کدام یک جمله
- evidence باید مستقیماً از رونوشت باشد
- confidence زیر 0.8 یعنی آن item را ننویس
- اگر چیزی برای خلاصه نیست: has_items=false و empty_reason بنویس

فقط JSON با این ساختار:
${schema}`,
      decisions: `از رونوشت جلسه، فقط تصمیمات قطعی و نهایی را استخراج کن.

قوانین سخت:
- پیشنهاد، بحث، یا احتمال = تصمیم نیست
- اگر تصمیم قطعی نبود، has_items=false
- هرگز برای پر کردن لیست حدس نزن
- هر item یک جمله کوتاه + evidence از رونوشت + confidence
- confidence زیر 0.8 یعنی آن item را ننویس

فقط JSON با این ساختار:
${schema}`,
      next_actions: `از رونوشت جلسه فقط اقدام‌های مشخص و قابل پیگیری را استخراج کن.

قوانین سخت:
- آرزو یا بحث کلی = اقدام نیست
- اگر اقدام مشخص نبود، has_items=false
- هرگز حدس نزن
- هر item یک جمله کوتاه + evidence + confidence
- confidence زیر 0.8 یعنی آن item را ننویس

فقط JSON با این ساختار:
${schema}`,
      highlights: `نکات مهم و قابل نقل جلسه را استخراج کن.

قوانین سخت:
- اگر نکته مهمی نبود، has_items=false
- هرگز حدس نزن
- حداکثر ۵ مورد
- evidence از رونوشت الزامی است
- confidence زیر 0.8 یعنی آن item را ننویس

فقط JSON با این ساختار:
${schema}`,
    };
  }

  return {
    summary: `You are a careful meeting secretary. Only write bullets when you have a meaningful summary.

Hard rules:
- If the transcript is too short or empty of content, has_items=false
- Never invent items to fill the list
- Max 5 bullets, one sentence each
- evidence must come directly from the transcript
- Drop items with confidence below 0.8
- If there is nothing to summarize: has_items=false and empty_reason

JSON only with this shape:
${schema}`,
    decisions: `Extract only final, definite decisions from the meeting transcript.

Hard rules:
- Suggestions, discussion, or possibilities are not decisions
- If there is no definite decision, has_items=false
- Never invent items
- Each item: short sentence + evidence + confidence
- Drop items with confidence below 0.8

JSON only with this shape:
${schema}`,
    next_actions: `Extract only concrete, followable action items from the transcript.

Hard rules:
- Wishes or vague discussion are not action items
- If there is no concrete action, has_items=false
- Never invent items
- Each item: short sentence + evidence + confidence
- Drop items with confidence below 0.8

JSON only with this shape:
${schema}`,
    highlights: `Extract important, quotable meeting highlights.

Hard rules:
- If nothing important stands out, has_items=false
- Never invent items
- Max 5 items
- evidence from the transcript is required
- Drop items with confidence below 0.8

JSON only with this shape:
${schema}`,
  };
}

export function getReviewSystemPrompt(locale: AiLocale): string {
  return locale === 'fa' ? REVIEW_SYSTEM_FA : REVIEW_SYSTEM_EN;
}

export function getExtractionPrompt(
  kind: MeetingExtractionKind,
  locale: AiLocale,
): string {
  return extractionPrompts(locale)[kind];
}

export const EMPTY_EXTRACTION_BY_LOCALE: Record<
  AiLocale,
  Record<MeetingExtractionKind, string>
> = {
  en: {
    summary: 'Not enough content to summarize.',
    decisions: 'No definite decisions were recorded in this meeting.',
    next_actions: 'No concrete action items were extracted.',
    highlights: 'No important highlights were found.',
  },
  fa: {
    summary: 'محتوای کافی برای خلاصه‌سازی وجود ندارد.',
    decisions: 'در این جلسه تصمیم قطعی ثبت نشده است.',
    next_actions: 'اقدام مشخصی از این جلسه استخراج نشد.',
    highlights: 'نکته مهمی برای ثبت پیدا نشد.',
  },
};
