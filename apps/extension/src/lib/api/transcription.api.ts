import type {
  StartRecordingResponse,
  StopRecordingResponse,
} from '@jalase/shared';
import { apiRequest, apiUpload } from './client';

export async function startRecording(
  token: string,
  noteId: string,
): Promise<StartRecordingResponse> {
  return apiRequest<StartRecordingResponse>(
    `/notes/${noteId}/recording/start`,
    { method: 'POST', token },
  );
}

export async function stopRecording(
  token: string,
  noteId: string,
): Promise<StopRecordingResponse> {
  return apiRequest<StopRecordingResponse>(`/notes/${noteId}/recording/stop`, {
    method: 'POST',
    token,
  });
}

export async function finalizeRecording(
  token: string,
  noteId: string,
  blob: Blob,
): Promise<StopRecordingResponse> {
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');

  return apiUpload<StopRecordingResponse>(
    `/notes/${noteId}/recording/finalize`,
    form,
    { token, timeoutMs: 600_000 },
  );
}
