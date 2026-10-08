import { apiRequest } from './client';

export interface FeatureFlagsMeResponse {
  tier: string;
  enabled: string[];
}

export async function getFeatureFlagsMe(
  token: string,
): Promise<FeatureFlagsMeResponse> {
  return apiRequest<FeatureFlagsMeResponse>('/feature-flags/me', { token });
}
