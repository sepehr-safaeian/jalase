import { describe, it, expect } from 'vitest';

import {

  assessTranscriptSufficiency,

  evidenceMatchesTranscript,

  isFillerExtractionText,

  isMeetingExtractionUsed,

  markMeetingExtractionUsed,

  parseExtractionResponse,

  syncNoteSection,

  validateExtractionCandidates,

} from './meeting-extractions.js';



describe('meeting-extractions', () => {

  it('syncNoteSection بخش خلاصه را پر می‌کند', () => {

    const doc = {

      type: 'doc',

      content: [

        {

          type: 'heading',

          attrs: { level: 2 },

          content: [{ type: 'text', text: 'خلاصه' }],

        },

        { type: 'bulletList', content: [{ type: 'listItem', content: [] }] },

      ],

    };



    const next = syncNoteSection(doc, 'خلاصه', ['نکته اول', 'نکته دوم'], 'bullet');

    const list = next.content?.[1];



    expect(list?.type).toBe('bulletList');

    expect(list?.content).toHaveLength(2);

  });



  it('syncNoteSection برای حالت خالی پاراگراف می‌نویسد', () => {

    const doc = { type: 'doc', content: [] };

    const next = syncNoteSection(doc, 'تصمیم‌ها', [], 'bullet', {

      emptyMessage: 'در این جلسه تصمیم قطعی ثبت نشده است.',

    });



    const section = next.content?.[1];

    expect(section?.type).toBe('paragraph');

    expect(section?.content?.[0]?.text).toBe(

      'در این جلسه تصمیم قطعی ثبت نشده است.',

    );

  });



  it('markMeetingExtractionUsed فقط یک بار اجازه می‌دهد', () => {

    const first = markMeetingExtractionUsed({}, 'summary');

    expect(isMeetingExtractionUsed(first, 'summary')).toBe(true);

    expect(isMeetingExtractionUsed(first, 'decisions')).toBe(false);

  });



  it('parseExtractionResponse حالت خالی را می‌خواند', () => {

    const parsed = parseExtractionResponse(

      JSON.stringify({

        has_items: false,

        empty_reason: 'نکته مهمی برای ثبت پیدا نشد.',

        items: [],

      }),

    );



    expect(parsed.hasItems).toBe(false);

    expect(parsed.emptyReason).toBe('نکته مهمی برای ثبت پیدا نشد.');

    expect(parsed.items).toHaveLength(0);

  });



  it('validateExtractionCandidates بدون evidence رد می‌کند', () => {

    const transcript = 'قرار شد پروژه تا آخر ماه تحویل داده شود.';

    const items = validateExtractionCandidates(

      [{ text: 'تحویل تا آخر ماه', confidence: 0.95 }],

      transcript,

      'decisions',

    );



    expect(items).toHaveLength(0);

  });



  it('validateExtractionCandidates با evidence معتبر قبول می‌کند', () => {

    const transcript = 'قرار شد پروژه تا آخر ماه تحویل داده شود.';

    const items = validateExtractionCandidates(

      [

        {

          text: 'تحویل پروژه تا آخر ماه',

          evidence: 'پروژه تا آخر ماه تحویل',

          confidence: 0.92,

        },

      ],

      transcript,

      'decisions',

    );



    expect(items).toEqual(['تحویل پروژه تا آخر ماه']);

  });



  it('evidenceMatchesTranscript با هم‌پوشانی کلمه کار می‌کند', () => {

    const transcript = 'تیم فروش باید تا جمعه گزارش را ارسال کند.';

    expect(

      evidenceMatchesTranscript('گزارش را تا جمعه ارسال کند', transcript),

    ).toBe(true);

  });



  it('assessTranscriptSufficiency رونوشت یک‌خطی کوتاه را رد می‌کند', () => {

    const result = assessTranscriptSufficiency('decisions', 'سلام خوبی؟');

    expect(result.sufficient).toBe(false);

    expect(result.reason).toContain('decision');

  });



  it('isFillerExtractionText عبارات کلی را تشخیص می‌دهد', () => {

    expect(isFillerExtractionText('نیاز به بررسی بیشتر دارد')).toBe(true);

    expect(isFillerExtractionText('تحویل تا آخر ماه')).toBe(false);

  });

});


