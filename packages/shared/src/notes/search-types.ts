export const NOTE_SEARCH_RECENT_DAYS = 30;
export const NOTE_SEARCH_DEFAULT_LIMIT = 15;
export const NOTE_SEARCH_MAX_LIMIT = 50;
export const NOTE_SEARCH_MIN_QUERY_LENGTH = 2;
export const NOTE_SEARCH_SNIPPET_RADIUS = 48;

export type NoteSearchScope = 'recent' | 'older';

export type NoteSearchMatchField = 'title' | 'content' | 'transcript';

export interface NoteSearchHit {
  id: string;
  title: string;
  meetingDate: string | null;
  updatedAt: string;
  snippet: string;
  matchField: NoteSearchMatchField;
  memberCount: number;
}

export interface NoteSearchResponse {
  items: NoteSearchHit[];
  hasMore: boolean;
  nextCursor: string | null;
  scope: NoteSearchScope;
  query: string;
  expandableToOlder: boolean;
}

export interface NoteSearchCursor {
  sortAt: string;
  id: string;
}

export interface SearchNotesQuery {
  q: string;
  scope?: NoteSearchScope;
  cursor?: string | null;
  limit?: number;
}
