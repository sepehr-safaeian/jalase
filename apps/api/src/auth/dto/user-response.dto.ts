import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ example: '+989123456789', nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ example: 'سپهر', nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ example: 'محمدی', nullable: true })
  lastName!: string | null;

  @ApiPropertyOptional({ example: 'sepehr@example.com', nullable: true })
  email!: string | null;

  @ApiPropertyOptional({
    example: '/api/v1/uploads/avatars/user-id.jpg',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ example: 'سپهر محمدی', nullable: true })
  displayName!: string | null;

  @ApiProperty({ example: true })
  aiDataSharingConsent!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
