import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { GuardrailsModule } from '../ai/guardrails/guardrails.module.js';
import { Project } from '../projects/entities/project.entity.js';
import { Note } from './entities/note.entity.js';
import { NoteMember } from './entities/note-member.entity.js';
import { MeetingExtractionService } from './meeting-extraction.service.js';
import { NotesController } from './notes.controller.js';
import { NotesService } from './notes.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, NoteMember, Project]),
    AuthModule,
    GuardrailsModule,
  ],
  controllers: [NotesController],
  providers: [NotesService, MeetingExtractionService],
  exports: [NotesService],
})
export class NotesModule {}
