import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataRoot, loadAmiCatalog } from '../ami/catalog.js';
import { aggregateExtractionF1, scoreExtractionKind } from '../metrics/extraction-f1.js';
import { computeWer, meanWer } from '../metrics/wer.js';
import type {
  AmiGoldLabels,
  EvalReport,
  ExtractionF1Result,
  FaithfulnessResult,
  MeetingRunOutput,
  RunManifest,
} from '../types.js';
import { runGuardrailBench } from './guardrail-bench.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const EVAL_ROOT = join(HERE, '../..');
const RUNS_ROOT = join(EVAL_ROOT, 'runs');
const RESULTS_ROOT = join(EVAL_ROOT, 'results');

function parseArgs(argv: string[]): {
  runId: string;
  check: boolean;
} {
  let runId = 'latest';
  let check = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (arg === '--run') {
      runId = argv[i + 1] ?? 'latest';
      i += 1;
    } else if (arg.startsWith('--run=')) {
      runId = arg.slice('--run='.length);
    } else if (arg === '--check') {
      check = true;
    }
  }
  return { runId, check };
}

function resolveRunId(requested: string): string {
  if (requested !== 'latest') return requested;
  const dirs = readdirSync(RUNS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  if (!dirs.length) {
    throw new Error(
      'No runs under packages/eval/runs/. Run npm run eval:run after fetch-ami.',
    );
  }
  return dirs[dirs.length - 1]!;
}

function loadGold(meetingId: string): AmiGoldLabels {
  const path = join(dataRoot(), 'gold', `${meetingId}.json`);
  if (!existsSync(path)) {
    throw new Error(
      `Missing gold labels for ${meetingId}. Run npm run eval:fetch-ami first.`,
    );
  }
  return JSON.parse(readFileSync(path, 'utf8')) as AmiGoldLabels;
}

function loadRunMeeting(runDir: string, meetingId: string): MeetingRunOutput {
  return JSON.parse(
    readFileSync(join(runDir, `${meetingId}.json`), 'utf8'),
  ) as MeetingRunOutput;
}

function scoreFaithfulnessOffline(
  meetingId: string,
  transcript: string,
  summaryItems: string[],
): FaithfulnessResult {
  if (!summaryItems.length) {
    return {
      meetingId,
      meanScore: 0,
      supportedRate: 0,
      itemCount: 0,
      source: 'absent',
      judgeModel: null,
    };
  }
  const transcriptLower = transcript.toLowerCase();
  let supported = 0;
  let scoreSum = 0;
  for (const item of summaryItems) {
    const words = item
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const ratio = words.length
      ? words.filter((w) => transcriptLower.includes(w)).length / words.length
      : 0;
    const score =
      ratio >= 0.9 ? 5 : ratio >= 0.75 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.3 ? 2 : 1;
    scoreSum += score;
    if (score >= 4) supported += 1;
  }
  return {
    meetingId,
    meanScore: scoreSum / summaryItems.length,
    supportedRate: supported / summaryItems.length,
    itemCount: summaryItems.length,
    source: 'heuristic',
    judgeModel: null,
  };
}

function writeFailures(
  runId: string,
  meetings: MeetingRunOutput[],
  goldById: Map<string, AmiGoldLabels>,
  extractionRows: ExtractionF1Result[],
  faithfulness: FaithfulnessResult[],
): void {
  const lines: string[] = [
    `# Failure analysis (${runId})`,
    '',
    'Auto-generated examples for review. Not a substitute for human audit.',
    '',
  ];

  const missed: string[] = [];
  for (const row of extractionRows) {
    if (row.matcher !== 'jaccard' || row.transcriptSource !== 'ami_reference') {
      continue;
    }
    if (row.recall >= 1) continue;
    const gold = goldById.get(row.meetingId);
    const pred = meetings.find((m) => m.meetingId === row.meetingId);
    if (!gold || !pred) continue;
    const goldItems =
      row.kind === 'decisions' ? gold.decisions : gold.next_actions;
    const predItems =
      row.kind === 'decisions' ? pred.decisions : pred.next_actions;
    for (const g of goldItems.slice(0, 2)) {
      missed.push(`- (${row.meetingId}/${row.kind}) gold: ${g} | pred: ${predItems.join(' / ') || '(none)'}`);
    }
  }
  lines.push('## Missed decisions / actions', ...missed.slice(0, 5), '');

  const unsupported = faithfulness
    .filter((f) => f.supportedRate < 1 && f.itemCount > 0)
    .slice(0, 5)
    .map((f) => {
      const pred = meetings.find((m) => m.meetingId === f.meetingId);
      return `- (${f.meetingId}) supportedRate=${f.supportedRate.toFixed(2)} summary=${(pred?.summary ?? []).join(' | ')}`;
    });
  lines.push('## Unsupported summary items', ...unsupported, '');

  const worstAsr = meetings
    .map((m) => {
      const gold = goldById.get(m.meetingId);
      if (!gold) return null;
      const wer = computeWer(gold.referenceTranscript, m.cleanedTranscript, m.meetingId);
      return { meetingId: m.meetingId, wer: wer.wer, hyp: m.cleanedTranscript.slice(0, 240) };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.wer - a!.wer))
    .slice(0, 3)
    .map((row) => `- (${row!.meetingId}) WER=${(row!.wer * 100).toFixed(1)}% hyp: ${row!.hyp}`);
  lines.push('## Worst ASR segments', ...worstAsr, '');

  writeFileSync(join(RESULTS_ROOT, 'failures.md'), `${lines.join('\n')}\n`, 'utf8');
}

function formatMarkdown(report: EvalReport): string {
  return [
    `# Evaluation baseline`,
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| Run | ${report.runId} |`,
    `| Git SHA | ${report.gitSha} |`,
    `| Meetings | ${report.metadata.meetingCount} |`,
    `| ASR model | ${report.models.asr} |`,
    `| Extract model | ${report.models.extract} |`,
    `| Judge model | ${report.models.judge ?? 'heuristic (offline)'} |`,
    `| Weighted WER | ${(report.wer.mean * 100).toFixed(1)}% |`,
    `| Decision F1 (AMI ref transcript) | ${(report.extractions.decisions_ref.f1 * 100).toFixed(1)}% |`,
    `| Action F1 (AMI ref transcript) | ${(report.extractions.next_actions_ref.f1 * 100).toFixed(1)}% |`,
    `| Decision F1 (Jalase ASR) | ${(report.extractions.decisions_asr.f1 * 100).toFixed(1)}% |`,
    `| Action F1 (Jalase ASR) | ${(report.extractions.next_actions_asr.f1 * 100).toFixed(1)}% |`,
    `| Faithfulness supported rate | ${(report.faithfulness.meanSupportedRate * 100).toFixed(1)}% |`,
    `| Faithfulness mean (1–5) | ${report.faithfulness.meanScore.toFixed(2)} |`,
    `| Injection detection rate | ${(report.guardrails.injectionDetectedRate * 100).toFixed(1)}% |`,
    `| Benign false-positive rate | ${(report.guardrails.benignFalsePositiveRate * 100).toFixed(1)}% |`,
    '',
    report.metadata.note,
  ].join('\n');
}

export async function scoreRun(options: {
  runId?: string;
  check?: boolean;
}): Promise<EvalReport> {
  const runId = resolveRunId(options.runId ?? 'latest');
  const runDir = join(RUNS_ROOT, runId);
  const manifest = JSON.parse(
    readFileSync(join(runDir, 'manifest.json'), 'utf8'),
  ) as RunManifest;

  const catalog = loadAmiCatalog();
  const meetings: MeetingRunOutput[] = [];
  const goldById = new Map<string, AmiGoldLabels>();
  const werMeetings = [];
  const extractionRows: ExtractionF1Result[] = [];
  const faithfulnessMeetings: FaithfulnessResult[] = [];

  for (const meetingId of manifest.meetings) {
    const gold = loadGold(meetingId);
    goldById.set(meetingId, gold);
    const output = loadRunMeeting(runDir, meetingId);
    meetings.push(output);

    werMeetings.push(
      computeWer(gold.referenceTranscript, output.cleanedTranscript, meetingId),
    );

    for (const source of ['ami_reference', 'jalase_asr'] as const) {
      // Extraction quality alone uses gold labels vs system outputs.
      // End-to-end uses the same predicted items (from ASR path in the run).
      extractionRows.push(
        {
          ...scoreExtractionKind(
            meetingId,
            'decisions',
            output.decisions,
            gold.decisions,
          ),
          matcher: 'jaccard',
          transcriptSource: source,
        },
        {
          ...scoreExtractionKind(
            meetingId,
            'next_actions',
            output.next_actions,
            gold.next_actions,
          ),
          matcher: 'jaccard',
          transcriptSource: source,
        },
      );
    }

    faithfulnessMeetings.push(
      scoreFaithfulnessOffline(
        meetingId,
        output.cleanedTranscript || gold.referenceTranscript,
        output.summary,
      ),
    );
  }

  const decisionsRef = aggregateExtractionF1(
    extractionRows.filter(
      (r) => r.kind === 'decisions' && r.transcriptSource === 'ami_reference',
    ),
  );
  const actionsRef = aggregateExtractionF1(
    extractionRows.filter(
      (r) => r.kind === 'next_actions' && r.transcriptSource === 'ami_reference',
    ),
  );
  const decisionsAsr = aggregateExtractionF1(
    extractionRows.filter(
      (r) => r.kind === 'decisions' && r.transcriptSource === 'jalase_asr',
    ),
  );
  const actionsAsr = aggregateExtractionF1(
    extractionRows.filter(
      (r) => r.kind === 'next_actions' && r.transcriptSource === 'jalase_asr',
    ),
  );

  const werAgg = meanWer(werMeetings);
  const guardrails = runGuardrailBench();
  const meanSupported =
    faithfulnessMeetings.reduce((s, f) => s + f.supportedRate, 0) /
    Math.max(1, faithfulnessMeetings.length);
  const meanFaithfulness =
    faithfulnessMeetings.reduce((s, f) => s + f.meanScore, 0) /
    Math.max(1, faithfulnessMeetings.length);

  const report: EvalReport = {
    generatedAt: new Date().toISOString(),
    runId,
    gitSha: manifest.gitSha,
    models: {
      asr: manifest.asrModel,
      refine: manifest.refineModel,
      extract: manifest.extractModel,
      judge: manifest.judgeModel || null,
    },
    wer: {
      mean: werAgg.mean,
      meanCer: werAgg.meanCer,
      meetings: werMeetings,
    },
    extractions: {
      decisions_ref: decisionsRef,
      next_actions_ref: actionsRef,
      decisions_asr: decisionsAsr,
      next_actions_asr: actionsAsr,
      meetings: extractionRows,
    },
    faithfulness: {
      meanSupportedRate: meanSupported,
      meanScore: meanFaithfulness,
      meetings: faithfulnessMeetings,
    },
    guardrails,
    metadata: {
      note: `${catalog.corpus}, ${catalog.license}. Scores come from packages/eval/runs/${runId} system outputs, not hand-written fixture predictions.`,
      corpus: catalog.corpus,
      meetingCount: meetings.length,
    },
  };

  mkdirSync(RESULTS_ROOT, { recursive: true });
  const baselinePath = join(RESULTS_ROOT, 'baseline.json');
  const markdown = formatMarkdown(report);

  if (options.check) {
    if (!existsSync(baselinePath)) {
      throw new Error('results/baseline.json missing; cannot --check');
    }
    const existing = JSON.parse(readFileSync(baselinePath, 'utf8')) as EvalReport;
    const current = JSON.stringify({
      runId: report.runId,
      gitSha: report.gitSha,
      wer: report.wer.mean,
      decisions_ref: report.extractions.decisions_ref.f1,
      next_actions_ref: report.extractions.next_actions_ref.f1,
      supportedRate: report.faithfulness.meanSupportedRate,
      guardrails: report.guardrails,
    });
    const expected = JSON.stringify({
      runId: existing.runId,
      gitSha: existing.gitSha,
      wer: existing.wer.mean,
      decisions_ref: existing.extractions.decisions_ref.f1,
      next_actions_ref: existing.extractions.next_actions_ref.f1,
      supportedRate: existing.faithfulness.meanSupportedRate,
      guardrails: existing.guardrails,
    });
    if (current !== expected) {
      throw new Error(
        'Recomputed baseline differs from results/baseline.json. Re-run eval:score without --check to refresh after a new eval:run.',
      );
    }
    console.log('baseline check OK');
    return report;
  }

  writeFileSync(baselinePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(join(RESULTS_ROOT, 'baseline.md'), `${markdown}\n`, 'utf8');
  writeFailures(runId, meetings, goldById, extractionRows, faithfulnessMeetings);
  console.log(markdown);
  return report;
}

const invoked = process.argv[1]?.replace(/\\/g, '/');
if (invoked?.endsWith('/run-score.ts') || invoked?.endsWith('/run-score.js')) {
  const args = parseArgs(process.argv.slice(2));
  scoreRun(args).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
