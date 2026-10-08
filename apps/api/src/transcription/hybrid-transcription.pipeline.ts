import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TranscriptTurn } from '@jalase/shared';
import { formatSpeakerLabel } from '@jalase/shared';
import { AvalAiService, type DiarizedSegment } from './avalai.service.js';
import { AudioSliceService, buildTurnId } from './audio-slice.service.js';
import { AudioProcessingError } from './audio-processing.error.js';
import { transcriptTextsOverlap } from './transcript-dedup.util.js';

export interface HybridChunkInput {
  audio: Buffer;
  mimeType: string;
  chunkIndex: number;
  chunkStartMs: number;
}

export interface HybridChunkResult {
  turns: TranscriptTurn[];
  draftTranscript: string;
  refinedTranscript: string;
}

interface ProcessOptions {
  requireSlice: boolean;
}

type SegmentAudioSource = 'full' | 'slice';

@Injectable()
export class HybridTranscriptionPipeline {
  private readonly logger = new Logger(HybridTranscriptionPipeline.name);
  private readonly liveDiarize: boolean;

  constructor(
    private readonly avalAi: AvalAiService,
    private readonly audioSlice: AudioSliceService,
    config: ConfigService,
  ) {
    this.liveDiarize = config.get<string>('AVALAI_LIVE_DIARIZE', 'false') === 'true';
  }

  /** رونویسی کامل بعد از پایان ضبط: diarize + re-transcribe روی هر segment */
  async processRecording(input: HybridChunkInput): Promise<HybridChunkResult> {
    this.audioSlice.assertAvailable();
    return this.processWithDiarize(input, { requireSlice: true });
  }

  async processChunk(input: HybridChunkInput): Promise<HybridChunkResult> {
    if (!this.liveDiarize) {
      return this.transcribeWholeChunkFallback(input);
    }

    return this.processWithDiarize(input, { requireSlice: false });
  }

  private async processWithDiarize(
    input: HybridChunkInput,
    options: ProcessOptions,
  ): Promise<HybridChunkResult> {
    const diarized = await this.avalAi.diarizeChunk({
      audio: input.audio,
      mimeType: input.mimeType,
      chunkIndex: input.chunkIndex,
    });

    if (!diarized.segments.length) {
      return this.transcribeWholeChunkFallback(input);
    }

    const turns: TranscriptTurn[] = [];

    for (const segment of diarized.segments) {
      const turn = await this.processDiarizedSegment(input, segment, options);
      if (!turn) continue;

      const reconciled = this.reconcileTurnAgainstPrior(turn, turns);
      if (reconciled) {
        turns.push(reconciled);
      }
    }

    if (!turns.length) {
      return this.transcribeWholeChunkFallback(input);
    }

    return this.buildResult(turns);
  }

  private async processDiarizedSegment(
    input: HybridChunkInput,
    segment: DiarizedSegment,
    options: ProcessOptions,
  ): Promise<TranscriptTurn | null> {
    const draftText = segment.text?.trim() ?? '';
    const startMs =
      input.chunkStartMs + Math.round(Math.max(0, segment.start) * 1000);
    const endMs =
      input.chunkStartMs + Math.round(Math.max(segment.start, segment.end) * 1000);

    const resolved = await this.resolveSegmentAudio(input, segment, options);
    let refinedText = draftText;
    let status: TranscriptTurn['status'] = draftText ? 'draft' : 'refined';

    if (resolved) {
      try {
        const transcribed = await this.avalAi.transcribeChunk({
          audio: resolved.audio,
          mimeType: resolved.mimeType,
          chunkIndex: input.chunkIndex,
        });
        refinedText = transcribed;
        status =
          transcribed.trim() && transcribed.trim() !== draftText
            ? 'refined'
            : draftText
              ? 'draft'
              : 'refined';
      } catch (err) {
        this.logger.warn(
          `Segment transcribe failed chunk ${input.chunkIndex}: ${
            err instanceof Error ? err.message : err
          }`,
        );
        if (options.requireSlice) {
          throw new AudioProcessingError(
            `رونویسی segment گوینده ${segment.speaker} ناموفق بود`,
          );
        }
      }
    } else if (options.requireSlice) {
      throw new AudioProcessingError(
        `برش صوتی segment گوینده ${segment.speaker} ناموفق بود`,
      );
    }

    const text = refinedText.trim() || draftText;
    if (!text.trim()) {
      return null;
    }

    return {
      id: buildTurnId(input.chunkIndex, segment.speaker, startMs),
      speakerId: segment.speaker,
      speakerLabel: formatSpeakerLabel(segment.speaker),
      startMs,
      endMs,
      draftText,
      text,
      status,
      chunkIndex: input.chunkIndex,
    };
  }

  private reconcileTurnAgainstPrior(
    turn: TranscriptTurn,
    priorTurns: TranscriptTurn[],
  ): TranscriptTurn | null {
    for (const prior of priorTurns) {
      if (prior.speakerId === turn.speakerId) continue;
      if (!transcriptTextsOverlap(turn.text, prior.text)) continue;

      const draft = turn.draftText.trim();
      if (draft && !transcriptTextsOverlap(draft, prior.text)) {
        this.logger.warn(
          `Duplicate refined text for ${turn.speakerLabel}; using diarization draft`,
        );
        return {
          ...turn,
          text: draft,
          status: 'draft',
        };
      }

      this.logger.warn(
        `Skipping duplicate turn for ${turn.speakerLabel} overlapping ${prior.speakerLabel}`,
      );
      return null;
    }

    return turn;
  }

  private async resolveSegmentAudio(
    input: HybridChunkInput,
    segment: DiarizedSegment,
    options: ProcessOptions,
  ): Promise<{ audio: Buffer; mimeType: string } | null> {
    const coversFull =
      segment.start <= 0.05 &&
      segment.end >= segment.durationSec - 0.05;

    if (coversFull) {
      if (!this.audioSlice.isAvailable()) {
        if (options.requireSlice) {
          throw new AudioProcessingError('ffmpeg برای پردازش صوتی در دسترس نیست');
        }
        return { audio: input.audio, mimeType: input.mimeType };
      }

      const sliced = await this.audioSlice.sliceSegment({
        audio: input.audio,
        mimeType: input.mimeType,
        startSec: segment.start,
        endSec: segment.end,
      });

      if (!sliced) {
        if (options.requireSlice) {
          throw new AudioProcessingError(
            `برش صوتی کامل segment ${segment.speaker} ناموفق بود`,
          );
        }
        return { audio: input.audio, mimeType: input.mimeType };
      }

      return sliced;
    }

    if (!this.audioSlice.isAvailable()) {
      if (options.requireSlice) {
        throw new AudioProcessingError('ffmpeg برای برش segment در دسترس نیست');
      }
      this.logger.warn(
        `ffmpeg unavailable; skipping re-transcribe for ${segment.speaker}`,
      );
      return null;
    }

    const sliced = await this.audioSlice.sliceSegment({
      audio: input.audio,
      mimeType: input.mimeType,
      startSec: segment.start,
      endSec: segment.end,
    });

    if (!sliced) {
      if (options.requireSlice) {
        throw new AudioProcessingError(
          `برش صوتی segment ${segment.speaker} (${segment.start}-${segment.end}s) ناموفق بود`,
        );
      }
      this.logger.warn(
        `Audio slice failed; using diarization draft for ${segment.speaker}`,
      );
      return null;
    }

    return sliced;
  }

  private async transcribeWholeChunkFallback(
    input: HybridChunkInput,
  ): Promise<HybridChunkResult> {
    const text = await this.avalAi.transcribeChunk({
      audio: input.audio,
      mimeType: input.mimeType,
      chunkIndex: input.chunkIndex,
    });

    const turn: TranscriptTurn = {
      id: buildTurnId(input.chunkIndex, 'speaker_0', input.chunkStartMs),
      speakerId: 'speaker_0',
      speakerLabel: formatSpeakerLabel('speaker_0'),
      startMs: input.chunkStartMs,
      endMs: input.chunkStartMs + 3000,
      draftText: text,
      text,
      status: 'refined',
      chunkIndex: input.chunkIndex,
    };

    return this.buildResult([turn]);
  }

  private buildResult(turns: TranscriptTurn[]): HybridChunkResult {
    const draftTranscript = turns
      .map((t) => `${t.speakerLabel}: ${t.draftText || t.text}`.trim())
      .filter(Boolean)
      .join('\n');
    const refinedTranscript = turns
      .map((t) => `${t.speakerLabel}: ${t.text}`.trim())
      .filter(Boolean)
      .join('\n');

    return {
      turns,
      draftTranscript,
      refinedTranscript,
    };
  }
}
