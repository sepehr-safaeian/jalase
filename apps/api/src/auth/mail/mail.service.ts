import { Injectable, Logger } from '@nestjs/common';

/** Stub mailer - logs OTP in development like SmsService */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendOtp(email: string, code: string): Promise<void> {
    this.logger.log(`[email-otp] to=${email} code=${code}`);
  }
}
