import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '+989123456789' })
  @IsString()
  @Matches(/^\+989\d{9}$/, {
    message: 'شماره موبایل باید به فرمت E.164 ایرانی باشد',
  })
  phone!: string;
}
