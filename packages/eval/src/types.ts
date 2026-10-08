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
}

export interface FaithfulnessResult {
  meetingId: string;
  score: number;
  rationale: string;
  source: 'live' | 'cached' | 'heuristic';
}

export interface EvalReport {
  generatedAt: string;
  corpus: {
    amiMeetings: number;
    qmsumMeetings: number;
  };
  wer: {
    mean: number;
    meanCer: number;
    meetings: WerResult[];
  };
  extractions: {
    decisions: { precision: number; recall: number; f1: number };
    next_actions: { precision: number; recall: number; f1: number };
    meetings: ExtractionF1Result[];
  };
  faithfulness: {
    mean: number;
    meetings: FaithfulnessResult[];
  };
  metadata: {
    judgeModel: string | null;
    note: string;
  };
}

export interface AmiFixture {
  id: string;
  source: 'ami-style';
  title: string;
  referenceTranscript: string;
  /** System hypothesis (refined transcript) for offline WER */
  hypothesisTranscript: string;
}

export interface QmSumFixture {
  id: string;
  source: 'qmsum-style';
  title: string;
  transcript: string;
  gold: {
    summary: string[];
    decisions: string[];
    next_actions: string[];
  };
  /** Predicted outputs for offline scoring (pipeline snapshot) */
  predicted: {
    summary: string[];
    decisions: string[];
    next_actions: string[];
  };
  /** Cached LLM-as-judge score for CI without API key */
  cachedFaithfulness?: {
    score: number;
    rationale: string;
  };
}
