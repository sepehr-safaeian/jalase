import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'سپهر' })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'نام باید بین ۲ تا ۵۰ کاراکتر باشد' })
  @Matches(/\S/, { message: 'نام نمی‌تواند خالی باشد' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'محمدی' })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'نام خانوادگی باید بین ۲ تا ۵۰ کاراکتر باشد' })
  @Matches(/\S/, { message: 'نام خانوادگی نمی‌تواند خالی باشد' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'sepehr@example.com', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  email?: string | null;

  @ApiPropertyOptional({
    example: 'سپهر محمدی',
    description: 'سازگاری با فرم onboarding تک‌فیلدی',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'نام باید بین ۲ تا ۱۰۰ کاراکتر باشد' })
  @Matches(/\S/, { message: 'نام نمی‌تواند خالی باشد' })
  displayName?: string;
}
