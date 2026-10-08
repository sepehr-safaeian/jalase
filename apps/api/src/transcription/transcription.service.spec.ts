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
            speakerLabel: 'Speaker A',
            startMs: 0,
            endMs: 3000,
            draftText: 'hel',
            text: 'hello',
            status: 'refined',
            chunkIndex: 0,
          },
        ],
        draftTranscript: 'Speaker A: hel',
        refinedTranscript: 'Speaker A: hello',
      }),
    };
    audioSlice = {
      assertAvailable: vi.fn(),
    };
    transcriptRefiner = {
      reviewTurns: vi.fn(async (turns) => turns),
    };

    const metrics = { record: vi.fn() };
    const guardrails = { redactForLogs: vi.fn((value: string) => value) };

    service = new TranscriptionService(
      notesRepo as never,
      chunksRepo as never,
      avalAi as never,
      hybridPipeline as never,
      transcriptRefiner as never,
      audioSlice as never,
      metrics as never,
      guardrails as never,
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
    expect(result.fullTranscript).toContain('Speaker A');
    expect(note.recordingStatus).toBe('idle');
  });
});
