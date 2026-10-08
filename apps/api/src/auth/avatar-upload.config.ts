import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

export const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function ensureAvatarUploadDir(): void {
  if (!existsSync(AVATAR_UPLOAD_DIR)) {
    mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
  }
}

export function avatarStorageFactory() {
  ensureAvatarUploadDir();

  return diskStorage({
    destination: AVATAR_UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase() || '.jpg';
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
        ? ext
        : '.jpg';
      const userId = (_req as { user?: { id: string } }).user?.id ?? 'unknown';
      cb(null, `${userId}${safeExt}`);
    },
  });
}

export function avatarFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(
      new BadRequestException('فقط تصاویر JPG، PNG یا WebP مجاز است'),
      false,
    );
    return;
  }

  cb(null, true);
}
