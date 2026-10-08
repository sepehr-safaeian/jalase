import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: '2026-08-30T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 'development' })
  environment!: string;

  @ApiProperty({ example: '0.1.0' })
  version!: string;
}
