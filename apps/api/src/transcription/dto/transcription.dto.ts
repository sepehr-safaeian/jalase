import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

function toOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export class TranscriptionChunkDto {
  @ApiPropertyOptional({ example: 0 })
  @Transform(({ value }) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  chunkIndex!: number;

  @ApiPropertyOptional({ example: 15000 })
  @Transform(({ value }) => toOptionalInt(value))
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMs?: number;

  @ApiPropertyOptional({ description: 'کلاینت تشخیص سکوت داده' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  clientSilent?: boolean;
}
