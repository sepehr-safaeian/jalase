import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { GuardrailsModule } from '../ai/guardrails/guardrails.module.js';
import { Note } from '../notes/entities/note.entity.js';
import { AudioSliceService } from './audio-slice.service.js';
import { OpenAiCompatibleClient } from './openai-compatible.client.js';
import { HybridTranscriptionPipeline } from './hybrid-transcription.pipeline.js';
import { TranscriptRefinerService } from './transcript-refiner.service.js';
import { NoteRecordingChunk } from './entities/note-recording-chunk.entity.js';
import { TranscriptionController } from './transcription.controller.js';
import { TranscriptionService } from './transcription.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, NoteRecordingChunk]),
    AuthModule,
    GuardrailsModule,
  ],
  controllers: [TranscriptionController],
  providers: [
    TranscriptionService,
    OpenAiCompatibleClient,
    AudioSliceService,
    HybridTranscriptionPipeline,
    TranscriptRefinerService,
  ],
  exports: [
    TranscriptionService,
    OpenAiCompatibleClient,
    HybridTranscriptionPipeline,
    TranscriptRefinerService,
    AudioSliceService,
  ],
})
export class TranscriptionModule {}
