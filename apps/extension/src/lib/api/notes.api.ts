import type { CreateNoteRequest, NoteDetail } from '@jalase/shared';
import { apiRequest } from './client';

export async function createNote(
  token: string,
  body: CreateNoteRequest,
): Promise<NoteDetail> {
  return apiRequest<NoteDetail>('/notes', {
    method: 'POST',
    token,
    body,
  });
}

export async function getNote(token: string, id: string): Promise<NoteDetail> {
  return apiRequest<NoteDetail>(`/notes/${id}`, { token });
}
