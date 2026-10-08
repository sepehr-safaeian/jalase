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
  MEETING_EXTRACTION_META,
  applySpeakerMappingsToTurns,
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
} from '@jalase/shared';
import {
  EMPTY_EXTRACTION_BY_LOCALE,
  getExtractionPrompt,
} from '../ai/prompt-packs.js';
import { resolveAiLocale, type AiLocale } from '../ai/prompt-locale.js';
import { GuardrailsService } from '../ai/guardrails/guardrails.service.js';
import { MetricsService } from '../observability/metrics.service.js';
import { PipelineTimer } from '../observability/pipeline-timer.js';
import { Note } from './entities/note.entity.js';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}
interface ExtractionRunResult {
  items: string[];
  emptyMessage: string;
  usedLlm: boolean;
  outcome: 'ok' | 'empty' | 'error' | 'guardrail_reject';
}
@Injectable()
export class MeetingExtractionService {
  private readonly logger = new Logger(MeetingExtractionService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly enabled: boolean;
  private readonly locale: AiLocale;

  constructor(
    config: ConfigService,
    @InjectRepository(Note)
    private readonly notesRepo: Repository<Note>,
    private readonly guardrails: GuardrailsService,
    private readonly metrics: MetricsService,
  ) {
    this.apiKey = config.get<string>('AVALAI_API_KEY', '');
    this.baseUrl = config.get<string>('AVALAI_BASE_URL', 'https://api.avalai.ir/v1');
    this.model = config.get<string>('AVALAI_EXTRACT_MODEL', 'qwen3.5-flash');
    this.enabled = config.get<string>('AVALAI_EXTRACT_ENABLED', 'true') !== 'false';
    this.locale = resolveAiLocale(config.get<string>('AI_LOCALE', 'en'));
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
      throw new ServiceUnavailableException('Smart extraction is unavailable');
    }
    const note = await this.notesRepo.findOne({
      where: { id: noteId, userId, deletedAt: IsNull() },
      relations: { project: true, members: true },
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    const transcript = this.resolveTranscript(note);
    if (!transcript.trim()) {
      throw new BadRequestException('This meeting has no transcript');
    }
    const extractions = parseMeetingAiExtractions(note.aiExtractionsJson);
    if (isMeetingExtractionUsed(extractions, kind)) {
      throw new BadRequestException('This extraction was already run for this meeting');
    }
    const meta = MEETING_EXTRACTION_META[kind];
    const timer = new PipelineTimer();
    let result: ExtractionRunResult;
    try {
      result = await this.runExtraction(kind, note.title, transcript);
    } catch (error) {
      const event = timer.finish('extract', 'error', {
        noteId,
        kind,
        errorMessage: this.guardrails.redactForLogs(
          error instanceof Error ? error.message : String(error),
        ),
      });
      this.metrics.record(event);
      this.logger.warn(
        JSON.stringify({
          msg: 'pipeline.stage',
          ...event,
        }),
      );
      throw error;
    }

    const event = timer.finish('extract', result.outcome, {
      noteId,
      kind,
      counts: { items: result.items.length },
    });
    this.metrics.record(event);
    this.logger.log(
      JSON.stringify({
        msg: 'pipeline.stage',
        ...event,
      }),
    );

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
    const defaultEmpty = EMPTY_EXTRACTION_BY_LOCALE[this.locale][kind];
    const precheck = this.guardrails.evaluateExtraction({
      kind,
      transcript,
    });
    if (precheck.rejectedByGuardrail) {
      return {
        items: [],
        emptyMessage: defaultEmpty,
        usedLlm: false,
        outcome: 'guardrail_reject',
      };
    }
    if (!precheck.sufficiency.sufficient) {
      return {
        items: [],
        emptyMessage: defaultEmpty,
        usedLlm: false,
        outcome: 'empty',
      };
    }
    const parsed = await this.callModel(kind, title, transcript);
    const validated = this.guardrails.filterExtraction(kind, parsed, transcript);
    if (validated.length) {
      return {
        items: validated,
        emptyMessage: defaultEmpty,
        usedLlm: true,
        outcome: 'ok',
      };
    }
    return {
      items: [],
      emptyMessage: parsed.emptyReason ?? defaultEmpty,
      usedLlm: true,
      outcome: 'empty',
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
  private buildUserPrompt(title: string, transcript: string): string {
    if (this.locale === 'fa') {
      return [
        `عنوان جلسه: ${title || 'بدون عنوان'}`,
        'رونوشت:',
        transcript.slice(0, 24_000),
      ].join('\n\n');
    }
    return [
      `Meeting title: ${title || 'Untitled'}`,
      'Transcript:',
      transcript.slice(0, 24_000),
    ].join('\n\n');
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
            { role: 'system', content: getExtractionPrompt(kind, this.locale) },
            {
              role: 'user',
              content: this.buildUserPrompt(title, transcript),
            },
          ],
        }),
        signal: controller.signal,
      });
      const body = (await response.json()) as ChatCompletionResponse;
      if (!response.ok) {
        this.logger.warn(`Extract failed: ${body.error?.message ?? response.statusText}`);
        throw new ServiceUnavailableException('Smart extraction failed');
      }
      const content = body.choices?.[0]?.message?.content ?? '';
      return parseExtractionResponse(content);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('abort')) {
        this.logger.warn(`Extract timeout after ${timeoutMs}ms`);
        throw new ServiceUnavailableException(
          'Smart extraction timed out. Please try again.',
        );
      }
      this.logger.warn(`Extract error: ${message}`);
      throw new ServiceUnavailableException('Smart extraction failed');
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
