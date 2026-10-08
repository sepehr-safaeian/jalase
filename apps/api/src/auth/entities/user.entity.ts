import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Iranian mobile E.164; null for email-only accounts */
  @Column({ type: 'varchar', unique: true, length: 16, nullable: true })
  phone!: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 50, nullable: true })
  firstName!: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 50, nullable: true })
  lastName!: string | null;

  @Column({ name: 'display_name', type: 'varchar', length: 100, nullable: true })
  displayName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  email!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'ai_data_sharing_consent', type: 'boolean', default: true })
  aiDataSharingConsent!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;
}
