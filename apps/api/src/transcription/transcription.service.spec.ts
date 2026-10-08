import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TranscriptionService } from './transcription.service.js';
import type { Note } from '../notes/entities/note.entity.js';

describe('TranscriptionService', () => {
  let service: TranscriptionService;
  let notesRepo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let chunksRepo: {
    count: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
  };
  let avalAi: {
    isConfigured: ReturnType<typeof vi.fn>;
  };
  let hybridPipeline: {
    processChunk: ReturnType<typeof vi.fn>;
    processRecording: ReturnType<typeof vi.fn>;
  };
  let audioSlice: {
    assertAvailable: ReturnType<typeof vi.fn>;
  };
  let transcriptRefiner: {
    reviewTurns: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    notesRepo = {
      findOne: vi.fn(),
      save: vi.fn(async (note: Note) => note),
    };
    chunksRepo = {
      count: vi.fn().mockResolvedValue(0),
      save: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
    };
    avalAi = {
      isConfigured: vi.fn().mockReturnValue(true),
    };
    hybridPipeline = {
      processChunk: vi.fn(),
      processRecording: vi.fn().mockResolvedValue({
        turns: [
          {
            id: 't1',
            speakerId: 'speaker_0',
            speakerLabel: 'گوینده 1',
            startMs: 0,
            endMs: 3000,
            draftText: 'سل',
            text: 'سلام',
            status: 'refined',
            chunkIndex: 0,
          },
        ],
        draftTranscript: 'گوینده 1: سل',
        refinedTranscript: 'گوینده 1: سلام',
      }),
    };
    audioSlice = {
      assertAvailable: vi.fn(),
    };
    transcriptRefiner = {
      reviewTurns: vi.fn(async (turns) => turns),
    };

    service = new TranscriptionService(
      notesRepo as never,
      chunksRepo as never,
      avalAi as never,
      hybridPipeline as never,
      transcriptRefiner as never,
      audioSlice as never,
    );
  });

  it('start sets recording status', async () => {
    const note = {
      id: 'n1',
      userId: 'u1',
      recordingStatus: 'idle',
      transcriptText: '',
      recordingAudioUrl: null,
      transcriptSegmentsJson: '',
      contentJson: '{"type":"doc","content":[]}',
    } as Note;

    notesRepo.findOne.mockResolvedValue(note);

    const result = await service.start('u1', 'n1');
    expect(result.status).toBe('recording');
    expect(note.recordingStatus).toBe('recording');
    expect(note.transcriptText).toBe('');
  });

  it('start rejects when note already recorded', async () => {
    const note = {
      id: 'n1',
      userId: 'u1',
      recordingStatus: 'idle',
      transcriptText: 'رونوشت قبلی',
      recordingAudioUrl: null,
      transcriptSegmentsJson: '',
      contentJson: '{}',
    } as Note;

    notesRepo.findOne.mockResolvedValue(note);

    await expect(service.start('u1', 'n1')).rejects.toThrow(
      'این جلسه قبلاً ضبط شده است',
    );
  });

  it('processChunk does not transcribe during recording', async () => {
    const note = {
      id: 'n1',
      userId: 'u1',
      recordingStatus: 'recording',
      transcriptText: '',
      transcriptSegmentsJson: '',
      contentJson: '{"type":"doc","content":[]}',
    } as Note;

    notesRepo.findOne.mockResolvedValue(note);

    const result = await service.processChunk(
      'u1',
      'n1',
      0,
      Buffer.alloc(3000),
      'audio/webm',
    );

    expect(result.text).toBe('');
    expect(hybridPipeline.processChunk).not.toHaveBeenCalled();
    expect(hybridPipeline.processRecording).not.toHaveBeenCalled();
  });

  it('finalizeRecording transcribes full audio after stop', async () => {
    const note = {
      id: 'n1',
      userId: 'u1',
      recordingStatus: 'recording',
      transcriptText: '',
      transcriptSegmentsJson: '',
      contentJson: '{"type":"doc","content":[]}',
    } as Note;

    notesRepo.findOne.mockResolvedValue(note);

    const result = await service.finalizeRecording(
      'u1',
      'n1',
      Buffer.alloc(3000),
      'audio/webm',
    );

    expect(hybridPipeline.processRecording).toHaveBeenCalled();
    expect(transcriptRefiner.reviewTurns).toHaveBeenCalled();
    expect(result.turns?.length).toBe(1);
    expect(result.fullTranscript).toContain('گوینده 1');
    expect(note.recordingStatus).toBe('idle');
  });
});
