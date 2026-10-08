import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto.js';

export class OtpSendResponseDto {
  @ApiProperty({ example: 120 })
  expiresIn!: number;

  @ApiPropertyOptional({ example: '123456' })
  devCode?: string;
}

export class OtpVerifyResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 604800 })
  expiresIn!: number;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty()
  isNewUser!: boolean;
}
