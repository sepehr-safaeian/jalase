import type { TranscriptTurn } from './transcript-segments.js';

export type RecordingStatus = 'idle' | 'recording' | 'processing';

export interface RecordingStatusResponse {
  status: RecordingStatus;
  transcriptText: string;
  recordingStartedAt: string | null;
  chunkCount: number;
  turns?: TranscriptTurn[];
  draftTranscript?: string;
}

export interface TranscriptionChunkResponse {
  chunkIndex: number;
  /** متن refined این chunk (legacy flat) */
  text: string;
  fullTranscript: string;
  contentJson: string;
  /** نوبت‌های گفتار این chunk */
  turns?: TranscriptTurn[];
  /** متن draft از diarization (قبل از refine) */
  draftTranscript?: string;
}

export interface StartRecordingResponse {
  status: RecordingStatus;
  recordingStartedAt: string;
}

export interface StopRecordingResponse {
  status: RecordingStatus;
  fullTranscript: string;
  contentJson: string;
  turns?: TranscriptTurn[];
  draftTranscript?: string;
  recordingAudioUrl?: string | null;
}
