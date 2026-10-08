import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  MEETING_LIST_MAX_LIMIT,
  MEETING_LIST_PAST_LIMIT,
} from '@jalase/shared';

export class ListProjectMeetingsQueryDto {
  @ApiPropertyOptional({ description: 'صفحه‌بندی cursor' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: MEETING_LIST_PAST_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MEETING_LIST_MAX_LIMIT)
  limit?: number;
}

export function resolveProjectMeetingsLimit(limit?: number): number {
  const resolved = limit ?? MEETING_LIST_PAST_LIMIT;
  return Math.min(Math.max(resolved, 1), MEETING_LIST_MAX_LIMIT);
}
