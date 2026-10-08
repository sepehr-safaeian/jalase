import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Note } from './note.entity.js';

@Entity('note_members')
export class NoteMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'note_id', type: 'uuid' })
  noteId!: string;

  @ManyToOne('Note', 'members', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note!: Note;

  @Column({ name: 'display_name', length: 100 })
  displayName!: string;

  @Column({ length: 254 })
  email!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
