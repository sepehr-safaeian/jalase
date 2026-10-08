import type { NoteSummary } from '../notes/types.js';

export interface Project {
  id: string;
  name: string;
  color: string | null;
  archivedAt: string | null;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  color?: string | null;
}

export interface UpdateProjectRequest {
  name?: string;
  color?: string | null;
}

export const PROJECT_COLOR_PRESETS = [
  '#187A45',
  '#22A35D',
  '#FEBE29',
  '#CEBEF8',
  '#FF91E0',
] as const;

export interface ProjectMeetingsQuery {
  cursor?: string;
  limit?: number;
}

export interface ProjectMeetingsResponse {
  projectId: string;
  items: NoteSummary[];
  nextCursor: string | null;
  hasMore: boolean;
}
