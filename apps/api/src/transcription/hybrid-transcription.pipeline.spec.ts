import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HybridTranscriptionPipeline } from './hybrid-transcription.pipeline.js';

describe('HybridTranscriptionPipeline', () => {
  let avalAi: {
    diarizeChunk: ReturnType<typeof vi.fn>;
    transcribeChunk: ReturnType<typeof vi.fn>;
  };
  let audioSlice: {
    isAvailable: ReturnType<typeof vi.fn>;
    assertAvailable: ReturnType<typeof vi.fn>;
    sliceSegment: ReturnType<typeof vi.fn>;
  };
  let pipeline: HybridTranscriptionPipeline;

  function createPipeline(liveDiarize = false) {
    return new HybridTranscriptionPipeline(
      avalAi as never,
      audioSlice as never,
      {
        get: vi.fn((key: string, fallback?: string) => {
          if (key === 'AVALAI_LIVE_DIARIZE') {
            return liveDiarize ? 'true' : 'false';
          }
          return fallback;
        }),
      } as never,
    );
  }

  beforeEach(() => {
    avalAi = {
      diarizeChunk: vi.fn().mockResolvedValue({
        segments: [
          {
            speaker: 'speaker_0',
            start: 0,
            end: 2.5,
            text: 'سل',
            durationSec: 3,
          },
          {
            speaker: 'speaker_1',
            start: 2.5,
            end: 3,
            text: 'نه',
            durationSec: 3,
          },
        ],
        durationSec: 3,
      }),
      transcribeChunk: vi
        .fn()
        .mockResolvedValueOnce('سلام')
        .mockResolvedValueOnce('نه مخالفم'),
    };
    audioSlice = {
      isAvailable: vi.fn().mockReturnValue(true),
      assertAvailable: vi.fn(),
      sliceSegment: vi.fn().mockResolvedValue({
        audio: Buffer.alloc(3000),
        mimeType: 'audio/wav',
      }),
    };

    pipeline = createPipeline(false);
  });

  it('uses whisper-only path for live chunks by default', async () => {
    avalAi.transcribeChunk.mockReset();
    avalAi.transcribeChunk.mockResolvedValue('سلام دنیا');

    const result = await pipeline.processChunk({
      audio: Buffer.alloc(5000),
      mimeType: 'audio/webm',
      chunkIndex: 0,
      chunkStartMs: 0,
    });

    expect(avalAi.diarizeChunk).not.toHaveBeenCalled();
    expect(avalAi.transcribeChunk).toHaveBeenCalledTimes(1);
    expect(result.turns[0]?.text).toBe('سلام دنیا');
  });

  it('diarizes then re-transcribes each segment when live diarize is enabled', async () => {
    pipeline = createPipeline(true);
    const result = await pipeline.processChunk({
      audio: Buffer.alloc(5000),
      mimeType: 'audio/webm',
      chunkIndex: 0,
      chunkStartMs: 0,
    });

    expect(avalAi.diarizeChunk).toHaveBeenCalledTimes(1);
    expect(avalAi.transcribeChunk).toHaveBeenCalledTimes(2);
    expect(result.turns).toHaveLength(2);
    expect(result.turns[0]?.text).toBe('سلام');
    expect(result.turns[1]?.text).toBe('نه مخالفم');
  });

  it('processRecording always diarizes regardless of live flag', async () => {
    pipeline = createPipeline(false);
    const result = await pipeline.processRecording({
      audio: Buffer.alloc(5000),
      mimeType: 'audio/webm',
      chunkIndex: 0,
      chunkStartMs: 0,
    });

    expect(audioSlice.assertAvailable).toHaveBeenCalled();
    expect(avalAi.diarizeChunk).toHaveBeenCalledTimes(1);
    expect(avalAi.transcribeChunk).toHaveBeenCalledTimes(2);
    expect(result.turns).toHaveLength(2);
  });
});
