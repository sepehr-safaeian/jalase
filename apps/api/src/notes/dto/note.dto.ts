import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateNoteDto {
  @ApiPropertyOptional({ example: 'جلسه برنامه‌ریزی' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional({ description: 'Tiptap document JSON (stringified)' })
  @IsOptional()
  @IsString()
  contentJson?: string;

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  contentMarkdown?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  meetingDate?: string | null;
}

export class UpdateNoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional({ description: 'Tiptap document JSON (stringified)' })
  @IsOptional()
  @IsString()
  contentJson?: string;

  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  contentMarkdown?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  meetingDate?: string | null;
}

export class AddNoteMemberDto {
  @ApiProperty({ example: 'سارا محمدی' })
  @IsString()
  @Length(2, 100)
  displayName!: string;

  @ApiProperty({ example: 'sara@example.com' })
  @IsEmail()
  email!: string;
}

export class UpdateSpeakerMappingsDto {
  @ApiProperty({
    example: { speaker_0: 'سپهر صفائیان', speaker_1: 'علی رضایی' },
    description: 'نگاشت speakerId به نام واقعی',
  })
  @IsObject()
  mappings!: Record<string, string>;
}
