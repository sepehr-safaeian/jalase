import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { BadRequestException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { MeetingExtractionService } from './meeting-extraction.service.js';
import { GuardrailsService } from '../ai/guardrails/guardrails.service.js';
import type { Note } from './entities/note.entity.js';



function makeNote(overrides: Partial<Note> = {}): Note {

  return {

    id: 'n1',

    userId: 'u1',

    projectId: null,

    project: null,

    title: 'جلسه',

    contentJson: '{"type":"doc","content":[]}',

    contentMarkdown: '',

    transcriptText: 'سلام خوبی؟',

    transcriptSegmentsJson: '',

    speakerNameMappingsJson: '{}',

    aiExtractionsJson: '{}',

    recordingStatus: 'idle',

    recordingStartedAt: null,

    recordingAudioUrl: null,

    meetingDate: new Date(),

    archivedAt: null,

    deletedAt: null,

    members: [],

    createdAt: new Date(),

    updatedAt: new Date(),

    ...overrides,

  } as Note;

}



describe('MeetingExtractionService', () => {

  let service: MeetingExtractionService;

  let notesRepo: {

    findOne: ReturnType<typeof vi.fn>;

    save: ReturnType<typeof vi.fn>;

  };

  const fetchMock = vi.fn();



  beforeEach(() => {

    vi.stubGlobal('fetch', fetchMock);



    notesRepo = {

      findOne: vi.fn(),

      save: vi.fn(async (note: Note) => note),

    };



    const config = {

      get: (key: string, fallback?: string) => {

        const values: Record<string, string> = {

          LLM_API_KEY: 'test-key',
          LLM_BASE_URL: 'https://api.openai.com/v1',
          EXTRACT_MODEL: 'gpt-4o-mini',
          EXTRACT_ENABLED: 'true',
          AI_LOCALE: 'fa',
          DEFAULT_TIER: 'plus',
          NODE_ENV: 'development',
        };

        return values[key] ?? fallback ?? '';

      },

    };



    const guardrails = new GuardrailsService(config as unknown as ConfigService);
    const metrics = { record: vi.fn() };

    service = new MeetingExtractionService(
      config as unknown as ConfigService,
      notesRepo as never,
      guardrails,
      metrics as never,
    );

  });



  afterEach(() => {

    vi.unstubAllGlobals();

    vi.clearAllMocks();

  });



  it('برای رونوشت کوتاه بدون LLM حالت خالی می‌نویسد', async () => {

    notesRepo.findOne.mockResolvedValue(makeNote());



    const result = await service.extract('u1', 'n1', 'decisions');



    expect(fetchMock).not.toHaveBeenCalled();

    expect(result.aiExtractions?.decisions).toBeTruthy();

    expect(result.contentJson).toContain('تصمیم قطعی ثبت نشده');

    expect(notesRepo.save).toHaveBeenCalled();

  });



  it('خروجی LLM را با evidence اعتبارسنجی می‌کند', async () => {

    const transcript =

      'قرار شد پروژه تا آخر ماه تحویل داده شود و تیم فروش گزارش هفتگی بفرستد.';



    notesRepo.findOne.mockResolvedValue(

      makeNote({ transcriptText: transcript }),

    );



    fetchMock.mockResolvedValue({

      ok: true,

      json: async () => ({

        choices: [

          {

            message: {

              content: JSON.stringify({

                has_items: true,

                empty_reason: null,

                items: [

                  {

                    text: 'تحویل پروژه تا آخر ماه',

                    evidence: 'پروژه تا آخر ماه تحویل داده شود',

                    confidence: 0.95,

                  },

                  {

                    text: 'گزارش هفتگی فروش',

                    evidence: 'تیم فروش گزارش هفتگی بفرستد',

                    confidence: 0.9,

                  },

                ],

              }),

            },

          },

        ],

      }),

    });



    const result = await service.extract('u1', 'n1', 'decisions');



    expect(fetchMock).toHaveBeenCalledOnce();

    expect(result.contentJson).toContain('تحویل پروژه تا آخر ماه');

    expect(result.contentJson).toContain('گزارش هفتگی فروش');

  });



  it('وقتی LLM آیتم بدون evidence می‌دهد، حالت خالی ثبت می‌کند', async () => {

    const transcript =

      'در مورد بودجه صحبت کردیم ولی هنوز عدد نهایی مشخص نشده است.';



    notesRepo.findOne.mockResolvedValue(

      makeNote({ transcriptText: transcript }),

    );



    fetchMock.mockResolvedValue({

      ok: true,

      json: async () => ({

        choices: [

          {

            message: {

              content: JSON.stringify({

                has_items: true,

                empty_reason: null,

                items: [

                  {

                    text: 'بودجه افزایش می‌یابد',

                    evidence: 'بودجه سال بعد دو برابر می‌شود',

                    confidence: 0.7,

                  },

                ],

              }),

            },

          },

        ],

      }),

    });



    const result = await service.extract('u1', 'n1', 'decisions');



    expect(result.contentJson).toContain('تصمیم قطعی ثبت نشده');

    expect(result.aiExtractions?.decisions).toBeTruthy();

  });



  it('استخراج تکراری را رد می‌کند', async () => {

    notesRepo.findOne.mockResolvedValue(

      makeNote({

        aiExtractionsJson: JSON.stringify({

          decisions: '2026-08-31T10:00:00.000Z',

        }),

      }),

    );



    await expect(service.extract('u1', 'n1', 'decisions')).rejects.toBeInstanceOf(

      BadRequestException,

    );

  });

});


