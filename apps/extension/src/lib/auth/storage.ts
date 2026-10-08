export const TOKEN_STORAGE_KEY = 'jalase_access_token';
export const USER_STORAGE_KEY = 'jalase_user';

export interface StoredUser {
  id: string;
  phone: string;
  displayName: string | null;
}

export async function getAccessToken(): Promise<string | null> {
  const result = await browser.storage.local.get(TOKEN_STORAGE_KEY);
  const token = result[TOKEN_STORAGE_KEY];
  return typeof token === 'string' ? token : null;
}

export async function setAccessToken(token: string): Promise<void> {
  await browser.storage.local.set({ [TOKEN_STORAGE_KEY]: token });
}

export async function clearAccessToken(): Promise<void> {
  await browser.storage.local.remove(TOKEN_STORAGE_KEY);
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const result = await browser.storage.local.get(USER_STORAGE_KEY);
  const user = result[USER_STORAGE_KEY];
  if (!user || typeof user !== 'object') return null;
  return user as StoredUser;
}

export async function setStoredUser(user: StoredUser): Promise<void> {
  await browser.storage.local.set({ [USER_STORAGE_KEY]: user });
}

export async function clearStoredUser(): Promise<void> {
  await browser.storage.local.remove(USER_STORAGE_KEY);
}

export async function clearSession(): Promise<void> {
  await browser.storage.local.remove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
}
