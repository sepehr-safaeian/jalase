import type {
  AddNoteMemberRequest,
  CreateNoteRequest,
  MeetingExtractionKind,
  NoteDetail,
  NoteSummary,
  UpdateNoteRequest,
  UpdateSpeakerMappingsRequest,
} from '@jalase/shared';
import { apiRequest } from './client';
import { getAccessToken } from '@/lib/auth/token-storage';

async function token() {
  const t = await getAccessToken();
  if (!t) throw new Error('نشست منقضی شده است');
  return t;
}

export async function listNotes(includeArchived = false): Promise<NoteSummary[]> {
  const query = includeArchived ? '?includeArchived=true' : '';
  return apiRequest<NoteSummary[]>(`/notes${query}`, { token: await token() });
}

export async function createNote(body: CreateNoteRequest): Promise<NoteDetail> {
  return apiRequest<NoteDetail>('/notes', {
    method: 'POST',
    token: await token(),
    body,
  });
}

export async function getNote(id: string): Promise<NoteDetail> {
  return apiRequest<NoteDetail>(`/notes/${id}`, { token: await token() });
}

export async function updateNote(
  id: string,
  body: UpdateNoteRequest,
): Promise<NoteDetail> {
  return apiRequest<NoteDetail>(`/notes/${id}`, {
    method: 'PATCH',
    token: await token(),
    body,
  });
}

export async function deleteNote(id: string): Promise<void> {
  await apiRequest(`/notes/${id}`, {
    method: 'DELETE',
    token: await token(),
  });
}

export async function archiveNote(id: string): Promise<NoteDetail> {
  return apiRequest<NoteDetail>(`/notes/${id}/archive`, {
    method: 'POST',
    token: await token(),
  });
}

export async function unarchiveNote(id: string): Promise<NoteDetail> {
  return apiRequest<NoteDetail>(`/notes/${id}/unarchive`, {
    method: 'POST',
    token: await token(),
  });
}

export async function addNoteMember(
  noteId: string,
  body: AddNoteMemberRequest,
): Promise<NoteDetail> {
  return apiRequest<NoteDetail>(`/notes/${noteId}/members`, {
    method: 'POST',
    token: await token(),
    body,
  });
}

export async function removeNoteMember(
  noteId: string,
  memberId: string,
): Promise<NoteDetail> {
  return apiRequest<NoteDetail>(`/notes/${noteId}/members/${memberId}`, {
    method: 'DELETE',
    token: await token(),
  });
}

export async function updateSpeakerMappings(
  noteId: string,
  body: UpdateSpeakerMappingsRequest,
): Promise<NoteDetail> {
  return apiRequest<NoteDetail>(`/notes/${noteId}/speaker-mappings`, {
    method: 'PATCH',
    token: await token(),
    body,
  });
}

export async function extractMeetingInsight(
  noteId: string,
  kind: MeetingExtractionKind,
): Promise<NoteDetail> {
  return apiRequest<NoteDetail>(`/notes/${noteId}/extractions/${kind}`, {
    method: 'POST',
    token: await token(),
    timeoutMs: 120_000,
  });
}
