export interface AmiMeetingMeta {
  id: string;
  scenario: string;
  hasAbstractiveSummary: boolean;
}

export interface AmiCatalog {
  corpus: string;
  license: string;
  citation: string;
  attributionUrl: string;
  annotationRelease: string;
  meetings: AmiMeetingMeta[];
}

export interface AmiGoldLabels {
  meetingId: string;
  referenceTranscript: string;
  decisions: string[];
  next_actions: string[];
  summary: string[];
  abstractSentences: string[];
}

export interface MeetingRunOutput {
  meetingId: string;
  title: string;
  rawAsrTranscript: string;
  cleanedTranscript: string;
  decisions: string[];
  next_actions: string[];
  summary: string[];
  latencyMs: {
    asr?: number;
    review?: number;
    extractDecisions?: number;
    extractActions?: number;
    extractSummary?: number;
    total?: number;
  };
  errors?: string[];
}

export interface RunManifest {
  runId: string;
  createdAt: string;
  gitSha: string;
  providerBaseUrl: string;
  asrModel: string;
  diarizeModel: string;
  refineModel: string;
  extractModel: string;
  judgeModel: string;
  promptPackVersion: string;
  temperature: number;
  meetings: string[];
  notes?: string;
}

export interface WerResult {
  meetingId: string;
  wer: number;
  cer: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  nWords: number;
  nChars: number;
}

export interface ExtractionF1Result {
  meetingId: string;
  kind: 'decisions' | 'next_actions';
  precision: number;
  recall: number;
  f1: number;
  matched: number;
  predicted: number;
  gold: number;
  matcher?: 'jaccard' | 'semantic';
  transcriptSource?: 'ami_reference' | 'jalase_asr';
}

export interface FaithfulnessResult {
  meetingId: string;
  meanScore: number;
  supportedRate: number;
  itemCount: number;
  source: 'live' | 'cached' | 'heuristic' | 'absent';
  judgeModel: string | null;
}

export interface GuardrailBenchResult {
  injectionDetectedRate: number;
  benignFalsePositiveRate: number;
  injectionCount: number;
  benignCount: number;
}

export interface EvalReport {
  generatedAt: string;
  runId: string;
  gitSha: string;
  models: {
    asr: string;
    refine: string;
    extract: string;
    judge: string | null;
  };
  wer: { mean: number; meanCer: number; meetings: WerResult[] };
  extractions: {
    decisions_ref: { precision: number; recall: number; f1: number };
    next_actions_ref: { precision: number; recall: number; f1: number };
    decisions_asr: { precision: number; recall: number; f1: number };
    next_actions_asr: { precision: number; recall: number; f1: number };
    meetings: ExtractionF1Result[];
  };
  faithfulness: {
    meanSupportedRate: number;
    meanScore: number;
    meetings: FaithfulnessResult[];
  };
  guardrails: GuardrailBenchResult;
  metadata: {
    note: string;
    corpus: string;
    meetingCount: number;
  };
}
