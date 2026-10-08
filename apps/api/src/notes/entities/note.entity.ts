import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';
import type { Project } from '../../projects/entities/project.entity.js';
import type { NoteMember } from './note-member.entity.js';

@Entity('notes')
@Index('idx_notes_user_meeting_date', ['userId', 'meetingDate'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @ManyToOne('Project', 'notes', {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'project_id' })
  project!: Project | null;

  @Column({ length: 200, default: 'یادداشت بدون عنوان' })
  title!: string;

  @Column({ name: 'content_json', type: 'text', default: '' })
  contentJson!: string;

  @Column({ name: 'content_markdown', type: 'text', default: '' })
  contentMarkdown!: string;

  @Column({ name: 'transcript_text', type: 'text', default: '' })
  transcriptText!: string;

  @Column({ name: 'recording_status', type: 'varchar', length: 20, default: 'idle' })
  recordingStatus!: 'idle' | 'recording' | 'processing';

  @Column({ name: 'recording_started_at', type: 'timestamptz', nullable: true })
  recordingStartedAt!: Date | null;

  @Column({ name: 'recording_audio_url', type: 'varchar', length: 512, nullable: true })
  recordingAudioUrl!: string | null;

  @Column({ name: 'transcript_context', type: 'text', default: '' })
  transcriptContext!: string;

  @Column({ name: 'transcript_segments_json', type: 'text', default: '' })
  transcriptSegmentsJson!: string;

  @Column({ name: 'speaker_name_mappings_json', type: 'text', default: '{}' })
  speakerNameMappingsJson!: string;

  @Column({ name: 'ai_extractions_json', type: 'text', default: '{}' })
  aiExtractionsJson!: string;

  @Column({ name: 'meeting_date', type: 'timestamptz', nullable: true })
  meetingDate!: Date | null;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany('NoteMember', 'note', { cascade: true })
  members!: NoteMember[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
