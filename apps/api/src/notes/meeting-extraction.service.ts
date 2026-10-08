import {

  BadRequestException,

  Injectable,

  Logger,

  NotFoundException,

  ServiceUnavailableException,

} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, Repository } from 'typeorm';

import type { MeetingExtractionKind, NoteDetail } from '@jalase/shared';

import {

  EMPTY_EXTRACTION_MESSAGES,

  MEETING_EXTRACTION_META,

  applySpeakerMappingsToTurns,

  assessTranscriptSufficiency,

  buildSpeakerProfiles,

  isMeetingExtractionUsed,

  markMeetingExtractionUsed,

  parseExtractionResponse,

  parseMeetingAiExtractions,

  parseSpeakerNameMappings,

  parseTranscriptDocument,

  serializeMeetingAiExtractions,

  syncNoteSection,

  turnsToFlatTranscript,

  validateExtractionCandidates,

} from '@jalase/shared';

import { Note } from './entities/note.entity.js';



const JSON_SCHEMA = `{

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



const PROMPTS: Record<MeetingExtractionKind, string> = {

  summary: `تو منشی محتاط جلسات فارسی هستی. فقط وقتی خلاصه معنادار داری، bullet بنویس.

قوانین سخت:

- اگر رونوشت خیلی کوتاه یا بی‌محتواست، has_items=false

- هرگز برای پر کردن لیست حدس نزن

- حداکثر ۵ bullet، هر کدام یک جمله

- evidence باید مستقیماً از رونوشت باشد

- confidence زیر 0.8 یعنی آن item را ننویس

- اگر چیزی برای خلاصه نیست: has_items=false و empty_reason بنویس

فقط JSON با این ساختار:

${JSON_SCHEMA}`,

  decisions: `از رونوشت جلسه، فقط تصمیمات قطعی و نهایی را استخراج کن.

قوانین سخت:

- پیشنهاد، بحث، یا احتمال = تصمیم نیست

- اگر تصمیم قطعی نبود، has_items=false

- هرگز برای پر کردن لیست حدس نزن

- هر item یک جمله کوتاه + evidence از رونوشت + confidence

- confidence زیر 0.8 یعنی آن item را ننویس

- empty_reason مثال: "در این جلسه تصمیم قطعی ثبت نشده است."

فقط JSON:

${JSON_SCHEMA}`,

  next_actions: `فقط اقدامات مشخص و قابل اجرا را استخراج کن.

قوانین سخت:

- اگر فعل اجرایی و زمان/مسئول مشخص نیست، ثبت نکن

- صحبت کلی یا ایده = اقدام نیست

- اگر اقدام مشخصی نیست، has_items=false

- هرگز برای پر کردن لیست حدس نزن

- evidence باید از رونوشت باشد

- confidence زیر 0.8 یعنی آن item را ننویس

فقط JSON:

${JSON_SCHEMA}`,

  highlights: `فقط نکات واقعاً ارزشمند را استخراج کن: risk، عدد کلیدی، insight غیربدیهی.

قوانین سخت:

- تکرار خلاصه یا حرف کلی = نکته مهم نیست

- اگر نکته مهمی نیست، has_items=false

- هرگز برای پر کردن لیست حدس نزن

- evidence باید از رونوشت باشد

- confidence زیر 0.8 یعنی آن item را ننویس

- empty_reason مثال: "نکته مهمی برای ثبت پیدا نشد."

فقط JSON:

${JSON_SCHEMA}`,

};



interface ChatCompletionResponse {

  choices?: Array<{ message?: { content?: string } }>;

  error?: { message?: string };

}



interface ExtractionRunResult {

  items: string[];

  emptyMessage: string;

  usedLlm: boolean;

}



@Injectable()

export class MeetingExtractionService {

  private readonly logger = new Logger(MeetingExtractionService.name);

  private readonly apiKey: string;

  private readonly baseUrl: string;

  private readonly model: string;

  private readonly enabled: boolean;



  constructor(

    config: ConfigService,

    @InjectRepository(Note)

    private readonly notesRepo: Repository<Note>,

  ) {

    this.apiKey = config.get<string>('AVALAI_API_KEY', '');

    this.baseUrl = config.get<string>('AVALAI_BASE_URL', 'https://api.avalai.ir/v1');

    this.model = config.get<string>('AVALAI_EXTRACT_MODEL', 'qwen3.5-flash');

    this.enabled = config.get<string>('AVALAI_EXTRACT_ENABLED', 'true') !== 'false';

  }



  isConfigured(): boolean {

    return this.enabled && Boolean(this.apiKey.trim());

  }



  async extract(

    userId: string,

    noteId: string,

    kind: MeetingExtractionKind,

  ): Promise<NoteDetail> {

    if (!this.isConfigured()) {

      throw new ServiceUnavailableException('سرویس استخراج هوشمند در دسترس نیست');

    }



    const note = await this.notesRepo.findOne({

      where: { id: noteId, userId, deletedAt: IsNull() },

      relations: { project: true, members: true },

    });



    if (!note) {

      throw new NotFoundException('یادداشت یافت نشد');

    }



    const transcript = this.resolveTranscript(note);

    if (!transcript.trim()) {

      throw new BadRequestException('برای این جلسه رونوشتی وجود ندارد');

    }



    const extractions = parseMeetingAiExtractions(note.aiExtractionsJson);

    if (isMeetingExtractionUsed(extractions, kind)) {

      throw new BadRequestException('این استخراج قبلاً برای این جلسه انجام شده است');

    }



    const meta = MEETING_EXTRACTION_META[kind];

    const result = await this.runExtraction(kind, note.title, transcript);



    let doc: Parameters<typeof syncNoteSection>[0];

    try {

      doc = JSON.parse(note.contentJson || '{"type":"doc","content":[]}');

    } catch {

      doc = { type: 'doc', content: [] };

    }



    const updatedDoc = syncNoteSection(

      doc,

      meta.heading,

      result.items,

      meta.listType,

      { emptyMessage: result.emptyMessage },

    );



    note.contentJson = JSON.stringify(updatedDoc);

    note.aiExtractionsJson = serializeMeetingAiExtractions(

      markMeetingExtractionUsed(extractions, kind),

    );



    await this.notesRepo.save(note);



    if (!result.usedLlm) {

      this.logger.log(`Extract ${kind}: fast-path empty (transcript too short)`);

    } else if (!result.items.length) {

      this.logger.log(`Extract ${kind}: conservative empty result`);

    } else {

      this.logger.log(`Extract ${kind}: ${result.items.length} validated items`);

    }



    return this.toDetail(note);

  }



  private async runExtraction(

    kind: MeetingExtractionKind,

    title: string,

    transcript: string,

  ): Promise<ExtractionRunResult> {

    const defaultEmpty = EMPTY_EXTRACTION_MESSAGES[kind];

    const sufficiency = assessTranscriptSufficiency(kind, transcript);



    if (!sufficiency.sufficient) {

      return {

        items: [],

        emptyMessage: sufficiency.reason ?? defaultEmpty,

        usedLlm: false,

      };

    }



    const parsed = await this.callModel(kind, title, transcript);

    const validated = validateExtractionCandidates(

      parsed.items,

      transcript,

      kind,

    );



    if (validated.length) {

      return {

        items: validated,

        emptyMessage: defaultEmpty,

        usedLlm: true,

      };

    }



    return {

      items: [],

      emptyMessage: parsed.emptyReason ?? defaultEmpty,

      usedLlm: true,

    };

  }



  private resolveTranscript(note: Note): string {

    const mappings = parseSpeakerNameMappings(note.speakerNameMappingsJson);

    const turns = parseTranscriptDocument(note.transcriptSegmentsJson ?? '').turns;

    if (turns.length) {

      return turnsToFlatTranscript(applySpeakerMappingsToTurns(turns, mappings));

    }

    return note.transcriptText ?? '';

  }



  private resolveLlmLimits(transcript: string): {

    timeoutMs: number;

    maxTokens: number;

  } {

    const length = transcript.trim().length;



    if (length < 300) {

      return { timeoutMs: 30_000, maxTokens: 512 };

    }



    if (length < 2_000) {

      return { timeoutMs: 60_000, maxTokens: 1024 };

    }



    return { timeoutMs: 90_000, maxTokens: 1536 };

  }



  private async callModel(

    kind: MeetingExtractionKind,

    title: string,

    transcript: string,

  ): Promise<ReturnType<typeof parseExtractionResponse>> {

    const { timeoutMs, maxTokens } = this.resolveLlmLimits(transcript);

    const controller = new AbortController();

    const timeout = setTimeout(() => controller.abort(), timeoutMs);



    try {

      const response = await fetch(`${this.baseUrl}/chat/completions`, {

        method: 'POST',

        headers: {

          Authorization: `Bearer ${this.apiKey}`,

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          model: this.model,

          temperature: 0.05,

          max_tokens: maxTokens,

          response_format: { type: 'json_object' },

          messages: [

            { role: 'system', content: PROMPTS[kind] },

            {

              role: 'user',

              content: [

                `عنوان جلسه: ${title || 'بدون عنوان'}`,

                'رونوشت:',

                transcript.slice(0, 24_000),

              ].join('\n\n'),

            },

          ],

        }),

        signal: controller.signal,

      });



      const body = (await response.json()) as ChatCompletionResponse;

      if (!response.ok) {

        this.logger.warn(`Extract failed: ${body.error?.message ?? response.statusText}`);

        throw new ServiceUnavailableException('استخراج هوشمند ناموفق بود');

      }



      const content = body.choices?.[0]?.message?.content ?? '';

      return parseExtractionResponse(content);

    } catch (error) {

      if (error instanceof ServiceUnavailableException) throw error;

      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('abort')) {

        this.logger.warn(`Extract timeout after ${timeoutMs}ms`);

        throw new ServiceUnavailableException(

          'استخراج هوشمند بیش از حد طول کشید. دوباره تلاش کنید.',

        );

      }

      this.logger.warn(`Extract error: ${message}`);

      throw new ServiceUnavailableException('استخراج هوشمند ناموفق بود');

    } finally {

      clearTimeout(timeout);

    }

  }



  private toDetail(note: Note): NoteDetail {

    const mappings = parseSpeakerNameMappings(note.speakerNameMappingsJson);

    const rawTurns = parseTranscriptDocument(note.transcriptSegmentsJson ?? '').turns;



    return {

      id: note.id,

      title: note.title,

      projectId: note.projectId,

      projectName: note.project?.name ?? null,

      meetingDate: note.meetingDate?.toISOString() ?? null,

      memberCount: note.members?.length ?? 0,

      archivedAt: note.archivedAt?.toISOString() ?? null,

      deletedAt: note.deletedAt?.toISOString() ?? null,

      createdAt: note.createdAt.toISOString(),

      updatedAt: note.updatedAt.toISOString(),

      contentJson: note.contentJson,

      contentMarkdown: note.contentMarkdown,

      transcriptText: note.transcriptText ?? '',

      transcriptTurns: applySpeakerMappingsToTurns(rawTurns, mappings),

      recordingStatus: note.recordingStatus ?? 'idle',

      recordingStartedAt: note.recordingStartedAt?.toISOString() ?? null,

      recordingAudioUrl: note.recordingAudioUrl ?? null,

      members: (note.members ?? []).map((member) => ({

        id: member.id,

        displayName: member.displayName,

        email: member.email,

        createdAt: member.createdAt.toISOString(),

      })),

      speakerMappings: mappings,

      speakers: buildSpeakerProfiles(rawTurns, mappings),

      aiExtractions: parseMeetingAiExtractions(note.aiExtractionsJson),

    };

  }

}


