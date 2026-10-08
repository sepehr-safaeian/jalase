import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import {
  NOTE_SEARCH_DEFAULT_LIMIT,
  NOTE_SEARCH_MAX_LIMIT,
  NOTE_SEARCH_MIN_QUERY_LENGTH,
  type NoteSearchScope,
} from '@jalase/shared';

export class SearchNotesQueryDto {
  @ApiProperty({ example: 'جیرا', minLength: NOTE_SEARCH_MIN_QUERY_LENGTH })
  @IsString()
  @MinLength(NOTE_SEARCH_MIN_QUERY_LENGTH)
  q!: string;

  @ApiPropertyOptional({ enum: ['recent', 'older'], default: 'recent' })
  @IsOptional()
  @IsIn(['recent', 'older'])
  scope?: NoteSearchScope;

  @ApiPropertyOptional({ description: 'Cursor for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: NOTE_SEARCH_DEFAULT_LIMIT, maximum: NOTE_SEARCH_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(NOTE_SEARCH_MAX_LIMIT)
  limit?: number;
}
