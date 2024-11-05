import { encrypt, decrypt } from './crypto';

const STORAGE_KEY = 'gh_auth';

export function saveAuthToken(token: string): void {
  const encrypted = encrypt(token);
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export function getAuthToken(): string | null {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;
  return decrypt(encrypted);
}

export function clearAuthToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}