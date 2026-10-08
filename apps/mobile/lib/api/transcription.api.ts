import type {
  RecordingStatusResponse,
  StartRecordingResponse,
  StopRecordingResponse,
  TranscriptionChunkResponse,
} from '@jalase/shared';
import { apiRequest, apiUpload } from './client';
import { getAccessToken } from '@/lib/auth/token-storage';

async function token() {
  const t = await getAccessToken();
  if (!t) throw new Error('نشست منقضی شده است');
  return t;
}

export async function getRecordingStatus(
  noteId: string,
): Promise<RecordingStatusResponse> {
  return apiRequest<RecordingStatusResponse>(
    `/notes/${noteId}/recording/status`,
    { token: await token() },
  );
}

export async function startRecording(
  noteId: string,
): Promise<StartRecordingResponse> {
  return apiRequest<StartRecordingResponse>(
    `/notes/${noteId}/recording/start`,
    { method: 'POST', token: await token() },
  );
}

export async function stopRecording(
  noteId: string,
): Promise<StopRecordingResponse> {
  return apiRequest<StopRecordingResponse>(`/notes/${noteId}/recording/stop`, {
    method: 'POST',
    token: await token(),
  });
}

export async function finalizeRecording(
  noteId: string,
  blob: Blob,
  mimeType: string,
): Promise<StopRecordingResponse> {
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');

  return apiUpload<StopRecordingResponse>(
    `/notes/${noteId}/recording/finalize`,
    form,
    { token: await token(), mimeType, timeoutMs: 300_000 },
  );
}

export async function uploadRecordingChunk(
  noteId: string,
  chunkIndex: number,
  blob: Blob,
  mimeType: string,
  durationMs?: number,
  clientSilent?: boolean,
): Promise<TranscriptionChunkResponse> {
  const form = new FormData();
  form.append('audio', blob, `chunk-${chunkIndex}.webm`);
  form.append('chunkIndex', String(chunkIndex));
  if (durationMs !== undefined) {
    form.append('durationMs', String(durationMs));
  }
  if (clientSilent) {
    form.append('clientSilent', 'true');
  }

  return apiUpload<TranscriptionChunkResponse>(
    `/notes/${noteId}/recording/chunk`,
    form,
    { token: await token(), mimeType, timeoutMs: 120_000 },
  );
}
