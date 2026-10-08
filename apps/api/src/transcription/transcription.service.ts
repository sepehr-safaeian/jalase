import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  RecordingStatusResponse,
  StartRecordingResponse,
  StopRecordingResponse,
  TranscriptionChunkResponse,
} from '@jalase/shared';
import {
  parseTranscriptDocument,
  serializeTranscriptDocument,
  syncTranscriptSection,
  turnsToFlatTranscript,
  type TranscriptTurn,
} from '@jalase/shared';
import { GuardrailsService } from '../ai/guardrails/guardrails.service.js';
import { MetricsService } from '../observability/metrics.service.js';
import { PipelineTimer } from '../observability/pipeline-timer.js';
import { Note } from '../notes/entities/note.entity.js';
import { NoteRecordingChunk } from './entities/note-recording-chunk.entity.js';
import { AvalAiService } from './avalai.service.js';
import { HybridTranscriptionPipeline } from './hybrid-transcription.pipeline.js';
import { TranscriptRefinerService } from './transcript-refiner.service.js';
import { AudioProcessingError } from './audio-processing.error.js';
import { AudioSliceService } from './audio-slice.service.js';
import {
  isLikelyHallucination,
} from './transcript-chunk.util.js';
import { saveNoteRecording } from './recording-storage.js';

const STALE_RECORDING_MS = 30 * 60 * 1000;

function isStaleRecording(startedAt: Date | null): boolean {
  if (!startedAt) return true;
  return Date.now() - startedAt.getTime() > STALE_RECORDING_MS;
}

function parseContentJson(raw: string): Record<string, unknown> {
  if (!raw.trim()) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }
}

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly noteLocks = new Map<string, Promise<void>>();
  private readonly hybridEnabled: boolean;

  constructor(
    @InjectRepository(Note)
    private readonly notesRepo: Repository<Note>,
    @InjectRepository(NoteRecordingChunk)
    private readonly chunksRepo: Repository<NoteRecordingChunk>,
    private readonly avalAi: AvalAiService,
    private readonly hybridPipeline: HybridTranscriptionPipeline,
    private readonly transcriptRefiner: TranscriptRefinerService,
    private readonly audioSlice: AudioSliceService,
    private readonly metrics: MetricsService,
    private readonly guardrails: GuardrailsService,
  ) {
    this.hybridEnabled =
      process.env.AVALAI_HYBRID_PIPELINE !== 'false';
  }

  private logStage(
    event: ReturnType<PipelineTimer['finish']>,
  ): void {
    this.metrics.record(event);
    this.logger.log(
      JSON.stringify({
        msg: 'pipeline.stage',
        ...event,
        errorMessage: event.errorMessage
          ? this.guardrails.redactForLogs(event.errorMessage)
          : undefined,
      }),
    );
  }

  async getStatus(
    userId: string,
    noteId: string,
  ): Promise<RecordingStatusResponse> {
    const note = await this.findOwned(userId, noteId);
    await this.resetStaleProcessing(note);
    const chunkCount = await this.chunksRepo.count({ where: { noteId } });
    const doc = parseTranscriptDocument(note.transcriptSegmentsJson);

    return {
      status: note.recordingStatus,
      transcriptText: note.transcriptText,
      recordingStartedAt: note.recordingStartedAt?.toISOString() ?? null,
      chunkCount,
      turns: doc.turns,
      draftTranscript: turnsToFlatTranscript(doc.turns, {
        includeTimestamp: true,
        preferDraft: true,
      }),
    };
  }

  private async resetStaleProcessing(note: Note): Promise<void> {
    if (note.recordingStatus !== 'processing') return;

    const updatedAt = note.updatedAt?.getTime() ?? 0;
    const stale = !updatedAt || Date.now() - updatedAt > 15 * 60 * 1000;
    if (!stale) return;

    this.logger.warn(`Resetting stale processing session for note ${note.id}`);
    note.recordingStatus = 'idle';
    note.recordingStartedAt = null;
    await this.notesRepo.save(note);
  }

  async start(userId: string, noteId: string): Promise<StartRecordingResponse> {
    if (!this.avalAi.isConfigured()) {
      throw new ServiceUnavailableException(
        'سرویس رونویسی پیکربندی نشده است',
      );
    }

    const note = await this.findOwned(userId, noteId);

    if (
      note.recordingAudioUrl?.trim() ||
      note.transcriptText.trim()
    ) {
      throw new BadRequestException('این جلسه قبلاً ضبط شده است');
    }

    const existingChunks = await this.chunksRepo.count({ where: { noteId } });
    if (existingChunks > 0) {
      throw new BadRequestException('این جلسه قبلاً ضبط شده است');
    }

    if (note.recordingStatus === 'recording') {
      if (!isStaleRecording(note.recordingStartedAt)) {
        return {
          status: 'recording',
          recordingStartedAt:
            note.recordingStartedAt?.toISOString() ?? new Date().toISOString(),
        };
      }

      this.logger.warn(
        `Resetting stale recording session for note ${noteId}`,
      );
      note.recordingStatus = 'idle';
      note.recordingStartedAt = null;
    }

    note.recordingStatus = 'recording';
    note.recordingStartedAt = new Date();
    note.transcriptText = '';
    note.transcriptSegmentsJson = serializeTranscriptDocument({
      version: 1,
      turns: [],
    });
    note.transcriptContext = '';
    await this.notesRepo.save(note);

    return {
      status: 'recording',
      recordingStartedAt: note.recordingStartedAt.toISOString(),
    };
  }

  async processChunk(
    userId: string,
    noteId: string,
    chunkIndex: number,
    audio: Buffer,
    mimeType: string,
    durationMs?: number,
    clientSilent?: boolean,
  ): Promise<TranscriptionChunkResponse> {
    if (!this.avalAi.isConfigured()) {
      throw new ServiceUnavailableException(
        'سرویس رونویسی پیکربندی نشده است',
      );
    }

    const note = await this.findOwned(userId, noteId);
    if (note.recordingStatus !== 'recording') {
      this.logger.warn(
        `Chunk ${chunkIndex} ignored for note ${noteId}: recording not active`,
      );
      return this.saveUnchanged(note, noteId, chunkIndex, durationMs);
    }

    if (!audio.length || audio.length < 2048) {
      throw new BadRequestException('بخش صوتی خیلی کوتاه است');
    }

    if (clientSilent) {
      return this.withNoteLock(noteId, async () =>
        this.saveUnchanged(
          await this.findOwned(userId, noteId),
          noteId,
          chunkIndex,
          durationMs,
        ),
      );
    }

    return this.withNoteLock(noteId, async () =>
      this.saveUnchanged(
        await this.findOwned(userId, noteId),
        noteId,
        chunkIndex,
        durationMs,
      ),
    );
  }

  async finalizeRecording(
    userId: string,
    noteId: string,
    audio: Buffer,
    mimeType: string,
  ): Promise<StopRecordingResponse> {
    if (!this.avalAi.isConfigured()) {
      throw new ServiceUnavailableException(
        'سرویس رونویسی پیکربندی نشده است',
      );
    }

    if (!audio.length || audio.length < 2048) {
      throw new BadRequestException('فایل صوتی خیلی کوتاه است');
    }

    const note = await this.findOwned(userId, noteId);
    if (note.recordingStatus !== 'recording') {
      throw new BadRequestException('ضبط فعال نیست');
    }

    note.recordingStatus = 'processing';
    await this.notesRepo.save(note);

    const recordingAudioUrl = saveNoteRecording(noteId, audio, mimeType);
    note.recordingAudioUrl = recordingAudioUrl;
    await this.notesRepo.save(note);

    const finalizeTimer = new PipelineTimer();
    this.logger.log(
      `Finalize started note=${noteId} audioBytes=${audio.length} mime=${mimeType}`,
    );

    try {
      this.audioSlice.assertAvailable();

      let hybridResult;
      const asrTimer = new PipelineTimer();
      try {
        if (!this.hybridEnabled) {
          throw new Error('Hybrid pipeline disabled');
        }
        this.logger.log(`Finalize note=${noteId}: ASR started`);
        hybridResult = await this.hybridPipeline.processRecording({
          audio,
          mimeType,
          chunkIndex: 0,
          chunkStartMs: 0,
        });
        this.logStage(
          asrTimer.finish('asr', 'ok', {
            noteId,
            counts: { turns: hybridResult.turns.length },
          }),
        );
      } catch (err) {
        this.logStage(
          asrTimer.finish('asr', 'error', {
            noteId,
            errorMessage: err instanceof Error ? err.message : String(err),
          }),
        );
        this.logger.warn(
          `Finalize transcription failed for note ${noteId}: ${
            err instanceof Error ? err.message : err
          }`,
        );
        const message =
          err instanceof AudioProcessingError
            ? err.message
            : 'رونویسی جلسه ناموفق بود. دوباره تلاش کنید.';
        throw new ServiceUnavailableException(message);
      }

      const incomingTurns = hybridResult.turns
        .filter(
          (turn) =>
            turn.text.trim() &&
            !isLikelyHallucination(turn.text, ''),
        )
        .map((turn) => ({
          ...turn,
          draftText: turn.draftText || turn.text,
        }));

      const reviewTimer = new PipelineTimer();
      this.logger.log(`Finalize note=${noteId}: review started`);
      const reviewedTurns = await this.transcriptRefiner.reviewTurns(
        incomingTurns,
        {
          noteTitle: note.title,
          recentContext: note.transcriptContext,
        },
      );
      this.logStage(
        reviewTimer.finish('review', 'ok', {
          noteId,
          counts: { turns: reviewedTurns.length },
        }),
      );

      const flatRefined = turnsToFlatTranscript(reviewedTurns, {
        includeTimestamp: true,
      });
      const flatRaw = turnsToFlatTranscript(incomingTurns, {
        includeTimestamp: true,
        preferDraft: true,
      });

      note.recordingStatus = 'idle';
      note.recordingStartedAt = null;
      note.transcriptSegmentsJson = serializeTranscriptDocument({
        version: 1,
        turns: reviewedTurns,
      });
      note.transcriptText = flatRefined;
      note.transcriptContext = flatRefined.slice(-400);

      const doc = syncTranscriptSection(
        parseContentJson(note.contentJson),
        flatRefined,
      );
      note.contentJson = JSON.stringify(doc);
      await this.notesRepo.save(note);

      await this.chunksRepo.save({
        noteId,
        chunkIndex: 0,
        transcriptText: hybridResult.refinedTranscript,
        durationMs: null,
        segmentsJson: JSON.stringify(reviewedTurns),
      });

      this.logger.log(
        JSON.stringify({
          msg: 'pipeline.stage',
          stage: 'finalize',
          noteId,
          durationMs: finalizeTimer.elapsedMs(),
          outcome: 'ok',
          counts: { turns: reviewedTurns.length },
        }),
      );

      return {
        status: 'idle',
        fullTranscript: flatRefined,
        contentJson: note.contentJson,
        turns: reviewedTurns,
        draftTranscript: flatRaw,
        recordingAudioUrl: note.recordingAudioUrl,
      };
    } catch (err) {
      if (note.recordingStatus === 'processing') {
        note.recordingStatus = 'idle';
        note.recordingStartedAt = null;
        await this.notesRepo.save(note);
      }
      throw err;
    }
  }

  async stop(userId: string, noteId: string): Promise<StopRecordingResponse> {
    const note = await this.findOwned(userId, noteId);
    const segmentDoc = parseTranscriptDocument(note.transcriptSegmentsJson);

    note.recordingStatus = 'idle';
    note.recordingStartedAt = null;
    note.transcriptContext = note.transcriptText.slice(-400);
    await this.notesRepo.save(note);

    return {
      status: 'idle',
      fullTranscript: note.transcriptText,
      contentJson: note.contentJson,
      turns: segmentDoc.turns,
      draftTranscript: turnsToFlatTranscript(segmentDoc.turns, {
        includeTimestamp: true,
        preferDraft: true,
      }),
      recordingAudioUrl: note.recordingAudioUrl,
    };
  }

  private async withNoteLock<T>(
    noteId: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previous = this.noteLocks.get(noteId) ?? Promise.resolve();
    this.noteLocks.set(
      noteId,
      previous.then(() => current),
    );

    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  private async saveUnchanged(
    note: Note,
    noteId: string,
    chunkIndex: number,
    durationMs?: number,
  ): Promise<TranscriptionChunkResponse> {
    const segmentDoc = parseTranscriptDocument(note.transcriptSegmentsJson);

    await this.chunksRepo.save({
      noteId,
      chunkIndex,
      transcriptText: '',
      durationMs: durationMs ?? null,
      segmentsJson: '',
    });

    return {
      chunkIndex,
      text: '',
      fullTranscript: note.transcriptText,
      contentJson: note.contentJson,
      turns: [] as TranscriptTurn[],
      draftTranscript: turnsToFlatTranscript(segmentDoc.turns, {
        includeTimestamp: true,
        preferDraft: true,
      }),
    };
  }

  private async findOwned(userId: string, noteId: string): Promise<Note> {
    const note = await this.notesRepo.findOne({
      where: { id: noteId, userId },
    });
    if (!note) {
      throw new NotFoundException('یادداشت یافت نشد');
    }
    return note;
  }
}
