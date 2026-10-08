import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+989123456789' })
  @IsString()
  @Matches(/^\+989\d{9}$/, {
    message: 'شماره موبایل باید به فرمت E.164 ایرانی باشد',
  })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'کد باید ۶ رقم باشد' })
  @Matches(/^\d{6}$/, { message: 'کد باید فقط شامل اعداد باشد' })
  code!: string;
}
