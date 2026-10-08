import type {
  CreateProjectRequest,
  Project,
  ProjectMeetingsResponse,
  UpdateProjectRequest,
} from '@jalase/shared';
import { apiRequest } from './client';
import { getAccessToken } from '@/lib/auth/token-storage';

async function token() {
  const t = await getAccessToken();
  if (!t) throw new Error('نشست منقضی شده است');
  return t;
}

export async function listProjects(includeArchived = false): Promise<Project[]> {
  const query = includeArchived ? '?includeArchived=true' : '';
  return apiRequest<Project[]>(`/projects${query}`, { token: await token() });
}

export async function getProject(id: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, { token: await token() });
}

export async function createProject(body: CreateProjectRequest): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    token: await token(),
    body,
  });
}

export async function updateProject(
  id: string,
  body: UpdateProjectRequest,
): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {
    method: 'PATCH',
    token: await token(),
    body,
  });
}

export async function listProjectMeetings(
  projectId: string,
  params?: { cursor?: string; limit?: number },
): Promise<ProjectMeetingsResponse> {
  const search = new URLSearchParams();
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<ProjectMeetingsResponse>(
    `/projects/${projectId}/meetings${query ? `?${query}` : ''}`,
    { token: await token() },
  );
}

export async function archiveProject(id: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}/archive`, {
    method: 'POST',
    token: await token(),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await apiRequest(`/projects/${id}`, {
    method: 'DELETE',
    token: await token(),
  });
}
