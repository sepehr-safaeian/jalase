import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomInt } from 'node:crypto';
import { existsSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';
import { IsNull, MoreThan, Repository } from 'typeorm';
import type {
  AuthUser,
  OtpSendResponse,
  OtpVerifyResponse,
} from '@jalase/shared';
import { User } from './entities/user.entity.js';
import { OtpChallenge } from './entities/otp-challenge.entity.js';
import { SmsService } from './sms/sms.service.js';
import { MailService } from './mail/mail.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto.js';
import { AVATAR_UPLOAD_DIR } from './avatar-upload.config.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';

const OTP_TTL_SECONDS = 120;
const MAX_OTP_ATTEMPTS = 5;
const DEV_OTP_CODE = '123456';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(OtpChallenge)
    private readonly otpRepo: Repository<OtpChallenge>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly smsService: SmsService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async sendOtp(phone: string): Promise<OtpSendResponse> {
    const isDev = this.config.get<string>('NODE_ENV') === 'development';
    const code = isDev ? DEV_OTP_CODE : this.generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    await this.otpRepo.delete({ phone });

    await this.otpRepo.save({
      phone,
      email: null,
      codeHash: this.hashCode(code),
      expiresAt,
      attempts: 0,
    });

    await this.smsService.sendOtp(phone, code);

    return {
      expiresIn: OTP_TTL_SECONDS,
      ...(isDev ? { devCode: code } : {}),
    };
  }

  async verifyOtp(phone: string, code: string): Promise<OtpVerifyResponse> {
    await this.assertValidOtp({ phone }, code);

    let user = await this.usersRepo.findOne({
      where: { phone },
      withDeleted: true,
    });

    if (user?.deletedAt) {
      throw new UnauthorizedException(
        'This account has been deleted and cannot be restored',
      );
    }

    const isNewUser = !user;

    if (!user) {
      user = await this.usersRepo.save({
        phone,
        firstName: null,
        lastName: null,
        displayName: null,
        email: null,
        avatarUrl: null,
        aiDataSharingConsent: true,
      });
    }

    await this.subscriptionsService.ensureFreeSubscription(user.id);

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      user: await this.toAuthUserWithSubscription(user),
      isNewUser,
    };
  }

  async sendEmailOtp(emailRaw: string): Promise<OtpSendResponse> {
    const email = emailRaw.trim().toLowerCase();
    const isDev = this.config.get<string>('NODE_ENV') === 'development';
    const code = isDev ? DEV_OTP_CODE : this.generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    await this.otpRepo.delete({ email });

    await this.otpRepo.save({
      phone: null,
      email,
      codeHash: this.hashCode(code),
      expiresAt,
      attempts: 0,
    });

    await this.mailService.sendOtp(email, code);

    return {
      expiresIn: OTP_TTL_SECONDS,
      ...(isDev ? { devCode: code } : {}),
    };
  }

  async verifyEmailOtp(
    emailRaw: string,
    code: string,
  ): Promise<OtpVerifyResponse> {
    const email = emailRaw.trim().toLowerCase();
    await this.assertValidOtp({ email }, code);

    let user = await this.usersRepo.findOne({
      where: { email },
      withDeleted: true,
    });

    if (user?.deletedAt) {
      throw new UnauthorizedException(
        'This account has been deleted and cannot be restored',
      );
    }

    const isNewUser = !user;

    if (!user) {
      user = await this.usersRepo.save({
        phone: null,
        firstName: null,
        lastName: null,
        displayName: null,
        email,
        avatarUrl: null,
        aiDataSharingConsent: true,
      });
    }

    await this.subscriptionsService.ensureFreeSubscription(user.id);

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      user: await this.toAuthUserWithSubscription(user),
      isNewUser,
    };
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.findActiveUser(userId);
    return this.toAuthUserWithSubscription(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<AuthUser> {
    const user = await this.findActiveUser(userId);
    const names = this.resolveIncomingNames(dto, user);

    if (names.firstName !== undefined) {
      user.firstName = names.firstName;
    }
    if (names.lastName !== undefined) {
      user.lastName = names.lastName;
    }
    if (dto.email !== undefined) {
      user.email = dto.email?.trim() ? dto.email.trim().toLowerCase() : null;
    }

    user.displayName = this.buildDisplayName(user.firstName, user.lastName);

    const saved = await this.usersRepo.save(user);
    return this.toAuthUserWithSubscription(saved);
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<AuthUser> {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }

    const user = await this.findActiveUser(userId);
    this.removeAvatarFile(user.avatarUrl);

    const ext = extname(file.filename).toLowerCase() || '.jpg';
    const avatarUrl = `/api/v1/uploads/avatars/${user.id}${ext}`;
    user.avatarUrl = avatarUrl;

    const saved = await this.usersRepo.save(user);
    return this.toAuthUserWithSubscription(saved);
  }

  async updateSettings(
    userId: string,
    dto: UpdateUserSettingsDto,
  ): Promise<AuthUser> {
    const user = await this.findActiveUser(userId);
    user.aiDataSharingConsent = dto.aiDataSharingConsent;
    const saved = await this.usersRepo.save(user);
    return this.toAuthUserWithSubscription(saved);
  }

  async softDeleteAccount(userId: string): Promise<void> {
    const user = await this.findActiveUser(userId);
    this.removeAvatarFile(user.avatarUrl);
    await this.usersRepo.softRemove(user);
  }

  private async assertValidOtp(
    where: { phone?: string; email?: string },
    code: string,
  ): Promise<void> {
    const challenge = await this.otpRepo.findOne({
      where: { ...where, expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });

    if (!challenge) {
      throw new BadRequestException('Code expired or was not requested');
    }

    if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException('Too many attempts');
    }

    challenge.attempts += 1;
    await this.otpRepo.save(challenge);

    if (challenge.codeHash !== this.hashCode(code)) {
      throw new UnauthorizedException('Invalid code');
    }

    await this.otpRepo.delete(where);
  }

  private async findActiveUser(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private resolveIncomingNames(
    dto: UpdateProfileDto,
    user: User,
  ): { firstName?: string | null; lastName?: string | null } {
    if (dto.displayName && dto.firstName === undefined) {
      const parts = dto.displayName.trim().split(/\s+/).filter(Boolean);
      return {
        firstName: parts[0] ?? null,
        lastName: parts.slice(1).join(' ') || null,
      };
    }

    return {
      firstName:
        dto.firstName !== undefined ? dto.firstName.trim() : undefined,
      lastName: dto.lastName !== undefined ? dto.lastName.trim() : undefined,
    };
  }

  private buildDisplayName(
    firstName: string | null,
    lastName: string | null,
  ): string | null {
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return displayName || null;
  }

  private removeAvatarFile(avatarUrl: string | null): void {
    if (!avatarUrl) {
      return;
    }

    const filename = avatarUrl.split('/').pop();
    if (!filename) {
      return;
    }

    const filePath = join(AVATAR_UPLOAD_DIR, filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  private async issueTokens(user: User) {
    const expiresIn = this.parseExpiresIn(
      this.config.get<string>('JWT_EXPIRES_IN', '7d'),
    );

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, phone: user.phone, email: user.email },
      { expiresIn },
    );

    return { accessToken, expiresIn };
  }

  private parseExpiresIn(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) {
      return 7 * 24 * 60 * 60;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }

  private generateOtpCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private async toAuthUserWithSubscription(user: User): Promise<AuthUser> {
    const subscription =
      await this.subscriptionsService.getSubscriptionSummary(user.id);
    return {
      ...this.toAuthUser(user),
      subscription,
    };
  }

  private toAuthUser(user: User): Omit<AuthUser, 'subscription'> {
    const names = this.resolveStoredNames(user);

    return {
      id: user.id,
      phone: user.phone,
      firstName: names.firstName,
      lastName: names.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      displayName: names.displayName,
      aiDataSharingConsent: user.aiDataSharingConsent,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private resolveStoredNames(user: User): {
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
  } {
    if (user.firstName?.trim()) {
      return {
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: this.buildDisplayName(user.firstName, user.lastName),
      };
    }

    if (user.displayName?.trim()) {
      const parts = user.displayName.trim().split(/\s+/).filter(Boolean);
      return {
        firstName: parts[0] ?? null,
        lastName: parts.slice(1).join(' ') || null,
        displayName: user.displayName.trim(),
      };
    }

    return {
      firstName: null,
      lastName: null,
      displayName: null,
    };
  }
}
