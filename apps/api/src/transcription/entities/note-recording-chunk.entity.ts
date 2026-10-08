import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Note } from '../../notes/entities/note.entity.js';

@Entity('note_recording_chunks')
export class NoteRecordingChunk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'note_id', type: 'uuid' })
  noteId!: string;

  @ManyToOne('Note', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note!: Note;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex!: number;

  @Column({ name: 'transcript_text', type: 'text', default: '' })
  transcriptText!: string;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs!: number | null;

  @Column({ name: 'segments_json', type: 'text', default: '' })
  segmentsJson!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
