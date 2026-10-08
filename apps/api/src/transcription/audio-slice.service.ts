import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AudioProcessingError } from './audio-processing.error.js';

const require = createRequire(import.meta.url);

export interface SlicedAudio {
  audio: Buffer;
  mimeType: 'audio/wav';
}

@Injectable()
export class AudioSliceService implements OnModuleInit {
  private readonly logger = new Logger(AudioSliceService.name);
  private cachedFfmpegPath: string | null | undefined;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const ffmpegPath = this.resolveFfmpegPath();
    if (!ffmpegPath) {
      this.logger.error(
        'ffmpeg در دسترس نیست. رونویسی با کیفیت بالا غیرفعال می‌ماند.',
      );
      return;
    }

    this.logger.log(`ffmpeg آماده: ${ffmpegPath}`);
  }

  isAvailable(): boolean {
    return Boolean(this.resolveFfmpegPath());
  }

  assertAvailable(): void {
    if (!this.isAvailable()) {
      throw new AudioProcessingError(
        'ffmpeg در دسترس نیست. نصب خودکار ناموفق بود؛ FFMPEG_PATH را در .env تنظیم کنید.',
      );
    }
  }

  /**
   * برش segment و تبدیل به WAV 16kHz mono برای ASR دقیق.
   */
  async sliceSegment(params: {
    audio: Buffer;
    mimeType: string;
    startSec: number;
    endSec: number;
  }): Promise<SlicedAudio | null> {
    const ffmpegPath = this.resolveFfmpegPath();
    if (!ffmpegPath) {
      return null;
    }

    const durationSec = Math.max(0.12, params.endSec - params.startSec);
    const ext = this.extensionForMime(params.mimeType);
    const dir = await mkdtemp(join(tmpdir(), 'jalase-audio-'));
    const inputPath = join(dir, `input.${ext}`);
    const outputPath = join(dir, 'slice.wav');

    try {
      await writeFile(inputPath, params.audio);

      await this.runFfmpeg(ffmpegPath, [
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        inputPath,
        '-ss',
        String(Math.max(0, params.startSec)),
        '-t',
        String(durationSec),
        '-vn',
        '-ac',
        '1',
        '-ar',
        '16000',
        '-c:a',
        'pcm_s16le',
        '-y',
        outputPath,
      ]);

      const output = await readFile(outputPath);
      if (output.length < 512) {
        return null;
      }

      return {
        audio: output,
        mimeType: 'audio/wav',
      };
    } catch (err) {
      this.logger.warn(
        `Audio slice failed (${params.startSec}-${params.endSec}s): ${
          err instanceof Error ? err.message : err
        }`,
      );
      return null;
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private resolveFfmpegPath(): string | null {
    if (this.cachedFfmpegPath !== undefined) {
      return this.cachedFfmpegPath;
    }

    const candidates = [
      this.config.get<string>('FFMPEG_PATH', '').trim(),
      this.findFfmpegOnPath(),
      this.resolveBundledFfmpeg(),
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        this.cachedFfmpegPath = candidate;
        return candidate;
      }
    }

    this.cachedFfmpegPath = null;
    return null;
  }

  private resolveBundledFfmpeg(): string | null {
    try {
      const installer = require('@ffmpeg-installer/ffmpeg') as {
        path: string;
      };
      return installer.path?.trim() || null;
    } catch (err) {
      this.logger.warn(
        `Bundled ffmpeg unavailable: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  private findFfmpegOnPath(): string | null {
    try {
      const command = process.platform === 'win32' ? 'where' : 'which';
      const result = spawnSync(command, ['ffmpeg'], {
        encoding: 'utf8',
        windowsHide: true,
      });
      const line = result.stdout
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .find(Boolean);
      return line ?? null;
    } catch {
      return null;
    }
  }

  private runFfmpeg(ffmpegPath: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(ffmpegPath, args, { windowsHide: true });
      let stderr = '';

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(stderr.trim() || `ffmpeg exited ${code}`));
      });
    });
  }

  private extensionForMime(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
    return 'webm';
  }
}

export function buildTurnId(
  chunkIndex: number,
  speakerId: string,
  startMs: number,
): string {
  return `${chunkIndex}-${speakerId}-${startMs}-${randomUUID().slice(0, 8)}`;
}
