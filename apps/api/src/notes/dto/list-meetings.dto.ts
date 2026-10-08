import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { MeetingBucket } from '@jalase/shared';
import {
  MEETING_LIST_DEFAULT_LIMIT,
  MEETING_LIST_MAX_LIMIT,
  MEETING_LIST_PAST_LIMIT,
  TEHRAN_TZ_OFFSET_MINUTES,
} from '@jalase/shared';

const BUCKETS = ['today', 'tomorrow', 'next_week', 'past'] as const;

export class ListMeetingsQueryDto {
  @ApiProperty({ enum: BUCKETS, description: 'باکت زمانی جلسات' })
  @IsEnum(BUCKETS)
  bucket!: MeetingBucket;

  @ApiPropertyOptional({ description: 'صفحه‌بندی (فقط گذشته)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: MEETING_LIST_DEFAULT_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MEETING_LIST_MAX_LIMIT)
  limit?: number;

  @ApiPropertyOptional({
    description: 'آفست زمانی محلی به دقیقه (مثل -getTimezoneOffset مرورگر)',
    default: TEHRAN_TZ_OFFSET_MINUTES,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tzOffsetMinutes?: number;
}

export function resolveMeetingListLimit(
  bucket: MeetingBucket,
  limit?: number,
): number {
  const fallback =
    bucket === 'past' ? MEETING_LIST_PAST_LIMIT : MEETING_LIST_DEFAULT_LIMIT;
  const resolved = limit ?? fallback;
  return Math.min(Math.max(resolved, 1), MEETING_LIST_MAX_LIMIT);
}
