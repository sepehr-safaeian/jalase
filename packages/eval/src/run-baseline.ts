import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAmiFixtures } from './loaders/ami.js';
import { loadQmSumFixtures } from './loaders/qmsum.js';
import {
  aggregateExtractionF1,
  scoreExtractionKind,
} from './metrics/extraction-f1.js';
import { judgeFaithfulness } from './metrics/faithfulness-judge.js';
import { computeWer, meanWer } from './metrics/wer.js';
import type { EvalReport, ExtractionF1Result } from './types.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = join(HERE, '../results/baseline.json');

type Suite = 'all' | 'wer' | 'extractions' | 'faithfulness';

function parseSuite(argv: string[]): Suite {
  const arg = argv.find((item) => item.startsWith('--suite='));
  if (!arg) return 'all';
  const value = arg.slice('--suite='.length);
  if (
    value === 'wer' ||
    value === 'extractions' ||
    value === 'faithfulness' ||
    value === 'all'
  ) {
    return value;
  }
  throw new Error(`Unknown suite: ${value}`);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMarkdown(report: EvalReport): string {
  const lines = [
    '### Evaluation baseline',
    '',
    `| Metric | Value |`,
    `|--------|------:|`,
    `| AMI WER (weighted) | ${pct(report.wer.mean)} |`,
    `| AMI CER (weighted) | ${pct(report.wer.meanCer)} |`,
    `| Decision F1 | ${pct(report.extractions.decisions.f1)} |`,
    `| Next-action F1 | ${pct(report.extractions.next_actions.f1)} |`,
    `| Summary faithfulness (1–5) | ${report.faithfulness.mean.toFixed(2)} |`,
    '',
    `_Generated ${report.generatedAt}_`,
  ];
  return lines.join('\n');
}

export async function runBaseline(suite: Suite = 'all'): Promise<EvalReport> {
  const ami = loadAmiFixtures();
  const qmsum = loadQmSumFixtures();

  const werMeetings =
    suite === 'all' || suite === 'wer'
      ? ami.map((fixture) =>
          computeWer(
            fixture.referenceTranscript,
            fixture.hypothesisTranscript,
            fixture.id,
          ),
        )
      : [];

  const extractionRows: ExtractionF1Result[] = [];
  if (suite === 'all' || suite === 'extractions') {
    for (const fixture of qmsum) {
      extractionRows.push(
        scoreExtractionKind(
          fixture.id,
          'decisions',
          fixture.predicted.decisions,
          fixture.gold.decisions,
        ),
        scoreExtractionKind(
          fixture.id,
          'next_actions',
          fixture.predicted.next_actions,
          fixture.gold.next_actions,
        ),
      );
    }
  }

  const decisionRows = extractionRows.filter((r) => r.kind === 'decisions');
  const actionRows = extractionRows.filter((r) => r.kind === 'next_actions');

  const faithfulnessMeetings = [];
  if (suite === 'all' || suite === 'faithfulness') {
    const apiKey = process.env.AVALAI_API_KEY ?? '';
    const baseUrl = process.env.AVALAI_BASE_URL ?? 'https://api.avalai.ir/v1';
    const model = process.env.AVALAI_EXTRACT_MODEL ?? 'qwen3.5-flash';
    for (const fixture of qmsum) {
      faithfulnessMeetings.push(
        await judgeFaithfulness({
          meetingId: fixture.id,
          transcript: fixture.transcript,
          summaryItems: fixture.predicted.summary,
          cached: fixture.cachedFaithfulness,
          apiKey,
          baseUrl,
          model,
          allowLive: Boolean(apiKey.trim()),
        }),
      );
    }
  }

  const werAgg = meanWer(werMeetings);
  const faithfulnessMean = faithfulnessMeetings.length
    ? faithfulnessMeetings.reduce((sum, row) => sum + row.score, 0) /
      faithfulnessMeetings.length
    : 0;

  const report: EvalReport = {
    generatedAt: new Date().toISOString(),
    corpus: {
      amiMeetings: ami.length,
      qmsumMeetings: qmsum.length,
    },
    wer: {
      mean: werAgg.mean,
      meanCer: werAgg.meanCer,
      meetings: werMeetings,
    },
    extractions: {
      decisions: aggregateExtractionF1(decisionRows),
      next_actions: aggregateExtractionF1(actionRows),
      meetings: extractionRows,
    },
    faithfulness: {
      mean: faithfulnessMean,
      meetings: faithfulnessMeetings,
    },
    metadata: {
      judgeModel: process.env.AVALAI_EXTRACT_MODEL ?? null,
      note: 'Curated AMI/QMSum-style fixtures. Not a full-corpus claim.',
    },
  };

  if (suite === 'all') {
    mkdirSync(dirname(RESULTS_PATH), { recursive: true });
    writeFileSync(RESULTS_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  return report;
}

async function main(): Promise<void> {
  const suite = parseSuite(process.argv.slice(2));
  const report = await runBaseline(suite);
  console.log(formatMarkdown(report));
  console.log('');
  console.log(JSON.stringify(report, null, 2));
  if (suite === 'all') {
    console.error(`Wrote ${RESULTS_PATH}`);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain || process.argv[1]?.endsWith('run-baseline.ts')) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
