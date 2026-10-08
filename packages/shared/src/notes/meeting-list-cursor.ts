import type { MeetingListCursor } from './meeting-list-types.js';

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUtf8(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeMeetingListCursor(cursor: MeetingListCursor): string {
  return utf8ToBase64(JSON.stringify(cursor));
}

export function decodeMeetingListCursor(raw: string): MeetingListCursor | null {
  try {
    const parsed = JSON.parse(base64ToUtf8(raw)) as MeetingListCursor;
    if (!parsed?.id || !parsed?.meetingDate) return null;
    return parsed;
  } catch {
    return null;
  }
}
