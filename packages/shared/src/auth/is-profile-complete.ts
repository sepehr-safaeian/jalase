import type { AuthUser } from './types.js';

export function isProfileComplete(
  user: Pick<AuthUser, 'firstName' | 'displayName'>,
): boolean {
  if (user.firstName?.trim()) {
    return true;
  }

  return Boolean(user.displayName?.trim());
}
