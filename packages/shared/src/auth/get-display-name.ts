import type { AuthUser } from './types.js';

export function getDisplayName(
  user: Pick<AuthUser, 'firstName' | 'lastName' | 'displayName'>,
): string {
  if (user.firstName?.trim()) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  }

  return user.displayName?.trim() ?? '';
}
