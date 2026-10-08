import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const RECORDING_UPLOAD_DIR = join(process.cwd(), 'uploads', 'recordings');

export function ensureRecordingUploadDir(): void {
  if (!existsSync(RECORDING_UPLOAD_DIR)) {
    mkdirSync(RECORDING_UPLOAD_DIR, { recursive: true });
  }
}

export function mimeToRecordingExt(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('webm')) return '.webm';
  if (normalized.includes('ogg')) return '.ogg';
  if (normalized.includes('mp4') || normalized.includes('m4a')) return '.m4a';
  return '.webm';
}

export function saveNoteRecording(
  noteId: string,
  audio: Buffer,
  mimeType: string,
): string {
  ensureRecordingUploadDir();
  const ext = mimeToRecordingExt(mimeType);
  const filename = `${noteId}${ext}`;
  writeFileSync(join(RECORDING_UPLOAD_DIR, filename), audio);
  return `/api/v1/uploads/recordings/${filename}`;
}
