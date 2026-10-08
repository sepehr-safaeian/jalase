import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserSettingsDto {
  @ApiProperty({
    example: true,
    description: 'رضایت اشتراک‌گذاری اطلاعات برای بهبود تجربه و هوش مصنوعی',
  })
  @IsBoolean()
  aiDataSharingConsent!: boolean;
}
