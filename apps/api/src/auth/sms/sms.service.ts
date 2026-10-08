import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(phone: string, code: string): Promise<void> {
    // فعلاً پنل پیامک وصل نیست؛ در توسعه کد در لاگ و پاسخ API برمی‌گردد
    this.logger.log(`OTP for ${phone}: ${code}`);
  }
}
