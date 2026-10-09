/**
 * Runs Jalase production ASR + extraction on AMI meetings and writes
 * packages/eval/runs/<run-id>/*.json (text only; audio never committed).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { turnsToFlatTranscript } from '@jalase/shared';
import { resolveLlmRuntimeConfig } from '../src/ai/llm-config.js';
import { GuardrailsModule } from '../src/ai/guardrails/guardrails.module.js';
import { MetricsService } from '../src/observability/metrics.service.js';
import { MeetingExtractionService } from '../src/notes/meeting-extraction.service.js';
import { Note } from '../src/notes/entities/note.entity.js';
import { OpenAiCompatibleClient } from '../src/transcription/openai-compatible.client.js';
import { AudioSliceService } from '../src/transcription/audio-slice.service.js';
import { HybridTranscriptionPipeline } from '../src/transcription/hybrid-transcription.pipeline.js';
import { TranscriptRefinerService } from '../src/transcription/transcript-refiner.service.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '../../..');
const EVAL_ROOT = join(REPO_ROOT, 'packages/eval');
const DATA_ROOT = join(EVAL_ROOT, '.data');

function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

function loadMeetingIds(): string[] {
  const catalog = JSON.parse(
    readFileSync(join(EVAL_ROOT, 'data/ami-meetings.json'), 'utf8'),
  ) as { meetings: Array<{ id: string }> };
  return catalog.meetings.map((m) => m.id);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(REPO_ROOT, '.env'), join(HERE, '../.env')],
    }),
    GuardrailsModule,
  ],
  providers: [
    MetricsService,
    OpenAiCompatibleClient,
    AudioSliceService,
    HybridTranscriptionPipeline,
    TranscriptRefinerService,
    MeetingExtractionService,
    {
      provide: getRepositoryToken(Note),
      useValue: {
        findOne: async () => null,
        save: async (note: unknown) => note,
      },
    },
  ],
})
class EvalRunModule {}

async function main(): Promise<void> {
  const meetingIds = loadMeetingIds();
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = join(EVAL_ROOT, 'runs', runId);
  mkdirSync(runDir, { recursive: true });

  const app = await NestFactory.createApplicationContext(EvalRunModule, {
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);
  const runtime = resolveLlmRuntimeConfig(config);
  if (!runtime.apiKey || !runtime.baseUrl) {
    throw new Error(
      'Set LLM_API_KEY and LLM_BASE_URL before npm run eval:run (deprecated: AVALAI_*).',
    );
  }

  const pipeline = app.get(HybridTranscriptionPipeline);
  const refiner = app.get(TranscriptRefinerService);
  const extraction = app.get(MeetingExtractionService);

  const completed: string[] = [];

  for (const meetingId of meetingIds) {
    const audioPath = join(DATA_ROOT, 'audio', `${meetingId}.Mix-Headset.wav`);
    const goldPath = join(DATA_ROOT, 'gold', `${meetingId}.json`);
    if (!existsSync(audioPath)) {
      console.warn(`skip ${meetingId}: missing audio ${audioPath}`);
      continue;
    }
    if (!existsSync(goldPath)) {
      console.warn(`skip ${meetingId}: missing gold ${goldPath}`);
      continue;
    }

    const gold = JSON.parse(readFileSync(goldPath, 'utf8')) as {
      referenceTranscript?: string;
    };
    const started = Date.now();
    const errors: string[] = [];
    let rawAsrTranscript = '';
    let cleanedTranscript = '';
    const latencyMs: Record<string, number> = {};

    try {
      const audio = readFileSync(audioPath);
      const asrStarted = Date.now();
      const hybrid = await pipeline.processRecording({
        audio,
        mimeType: 'audio/wav',
        chunkIndex: 0,
        chunkStartMs: 0,
      });
      latencyMs.asr = Date.now() - asrStarted;
      rawAsrTranscript = turnsToFlatTranscript(hybrid.turns, {
        preferDraft: true,
      });

      const reviewStarted = Date.now();
      const reviewed = await refiner.reviewTurns(hybrid.turns, {
        noteTitle: meetingId,
      });
      latencyMs.review = Date.now() - reviewStarted;
      cleanedTranscript = turnsToFlatTranscript(reviewed);
    } catch (error) {
      errors.push(`asr/review: ${error instanceof Error ? error.message : String(error)}`);
      cleanedTranscript = gold.referenceTranscript ?? '';
      rawAsrTranscript = cleanedTranscript;
    }

    const transcriptForExtract = cleanedTranscript || gold.referenceTranscript || '';
    const kinds = ['decisions', 'next_actions', 'summary'] as const;
    const outputs: Record<(typeof kinds)[number], string[]> = {
      decisions: [],
      next_actions: [],
      summary: [],
    };

    for (const kind of kinds) {
      const key =
        kind === 'decisions'
          ? 'extractDecisions'
          : kind === 'next_actions'
            ? 'extractActions'
            : 'extractSummary';
      const t0 = Date.now();
      try {
        const result = await extraction.extractFromTranscript(
          kind,
          meetingId,
          transcriptForExtract,
        );
        outputs[kind] = result.items;
      } catch (error) {
        errors.push(
          `${kind}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      latencyMs[key] = Date.now() - t0;
    }

    latencyMs.total = Date.now() - started;
    const meetingOut = {
      meetingId,
      title: meetingId,
      rawAsrTranscript,
      cleanedTranscript,
      decisions: outputs.decisions,
      next_actions: outputs.next_actions,
      summary: outputs.summary,
      latencyMs,
      errors: errors.length ? errors : undefined,
    };
    writeFileSync(
      join(runDir, `${meetingId}.json`),
      `${JSON.stringify(meetingOut, null, 2)}\n`,
      'utf8',
    );
    completed.push(meetingId);
    console.log(`wrote ${meetingId} (${latencyMs.total}ms)`);
  }

  const manifest = {
    runId,
    createdAt: new Date().toISOString(),
    gitSha: gitSha(),
    providerBaseUrl: runtime.baseUrl,
    asrModel: runtime.asrModel,
    diarizeModel: runtime.diarizeModel,
    refineModel: runtime.refineModel,
    extractModel: runtime.extractModel,
    judgeModel: runtime.judgeModel,
    promptPackVersion: 'apps/api/src/ai/prompt-packs.ts',
    temperature: 0,
    meetings: completed,
    notes:
      'System outputs from Jalase HybridTranscriptionPipeline + MeetingExtractionService.',
  };
  writeFileSync(
    join(runDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  console.log(`Run complete: ${runDir}`);
  await app.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
