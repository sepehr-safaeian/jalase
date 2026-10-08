import type { NoteSearchResponse, NoteSearchScope, SearchNotesQuery } from '@jalase/shared';
import { apiRequest } from './client';
import { getAccessToken } from '@/lib/auth/token-storage';

async function token() {
  const t = await getAccessToken();
  if (!t) throw new Error('نشست منقضی شده است');
  return t;
}

function buildSearchQuery(params: SearchNotesQuery): string {
  const search = new URLSearchParams();
  search.set('q', params.q);
  if (params.scope) search.set('scope', params.scope);
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));
  return search.toString();
}

export async function searchNotes(params: SearchNotesQuery): Promise<NoteSearchResponse> {
  const query = buildSearchQuery(params);
  return apiRequest<NoteSearchResponse>(`/notes/search?${query}`, {
    token: await token(),
  });
}

export type { NoteSearchScope };
