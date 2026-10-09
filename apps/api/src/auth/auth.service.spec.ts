import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { SmsService } from './sms/sms.service.js';
import type { User } from './entities/user.entity.js';
import type { OtpChallenge } from './entities/otp-challenge.entity.js';
import { createHash } from 'node:crypto';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    softRemove: ReturnType<typeof vi.fn>;
  };
  let otpRepo: {
    delete: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    usersRepo = {
      findOne: vi.fn(),
      save: vi.fn(),
      softRemove: vi.fn(),
    };
    otpRepo = {
      delete: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
    };

    const jwtService = {
      signAsync: vi.fn().mockResolvedValue('token-abc'),
    } as unknown as JwtService;

    const config = {
      get: vi.fn((key: string, fallback?: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'JWT_EXPIRES_IN') return '7d';
        return fallback;
      }),
    } as unknown as ConfigService;

    const smsService = {
      sendOtp: vi.fn(),
    } as unknown as SmsService;

    const mailService = {
      sendOtp: vi.fn(),
    };

    const subscriptionsService = {
      ensureFreeSubscription: vi.fn().mockResolvedValue({}),
      getSubscriptionSummary: vi.fn().mockResolvedValue({
        planKey: 'free',
        tier: 'free',
        status: 'active',
        expiresAt: null,
        aiUsageCount: 0,
        aiMonthlyLimit: null,
        billingPeriodKey: null,
      }),
    };

    service = new AuthService(
      usersRepo as never,
      otpRepo as never,
      jwtService,
      config,
      smsService,
      mailService as never,
      subscriptionsService as never,
    );
  });

  it('sendOtp در توسعه کد ثابت برمی‌گرداند', async () => {
    otpRepo.save.mockResolvedValue({});
    otpRepo.delete.mockResolvedValue({});

    const result = await service.sendOtp('+989123456789');

    expect(result.expiresIn).toBe(120);
    expect(result.devCode).toBe('123456');
    expect(otpRepo.save).toHaveBeenCalled();
  });

  it('verifyOtp کاربر جدید می‌سازد', async () => {
    const challenge: OtpChallenge = {
      id: '1',
      phone: '+989123456789',
      codeHash: createHash('sha256').update('123456').digest('hex'),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      createdAt: new Date(),
    };

    otpRepo.findOne.mockResolvedValue(challenge);
    otpRepo.save.mockResolvedValue(challenge);
    otpRepo.delete.mockResolvedValue({});
    usersRepo.findOne.mockResolvedValue(null);

    const savedUser: User = {
      id: 'user-1',
      phone: '+989123456789',
      firstName: null,
      lastName: null,
      displayName: null,
      email: null,
      avatarUrl: null,
      aiDataSharingConsent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    usersRepo.save.mockResolvedValue(savedUser);

    const result = await service.verifyOtp('+989123456789', '123456');

    expect(result.isNewUser).toBe(true);
    expect(result.accessToken).toBe('token-abc');
    expect(result.user.phone).toBe('+989123456789');
  });

  it('updateProfile نام و ایمیل را ذخیره می‌کند', async () => {
    const user: User = {
      id: 'user-1',
      phone: '+989123456789',
      firstName: 'سپهر',
      lastName: null,
      displayName: 'سپهر',
      email: null,
      avatarUrl: null,
      aiDataSharingConsent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    usersRepo.findOne.mockResolvedValue(user);
    usersRepo.save.mockImplementation(async (value: User) => value);

    const result = await service.updateProfile('user-1', {
      lastName: 'محمدی',
      email: 'sepehr@example.com',
    });

    expect(result.lastName).toBe('محمدی');
    expect(result.email).toBe('sepehr@example.com');
    expect(result.displayName).toBe('سپهر محمدی');
  });

  it('updateSettings رضایت AI را ذخیره می‌کند', async () => {
    const user: User = {
      id: 'user-1',
      phone: '+989123456789',
      firstName: 'سپهر',
      lastName: 'محمدی',
      displayName: 'سپهر محمدی',
      email: null,
      avatarUrl: null,
      aiDataSharingConsent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    usersRepo.findOne.mockResolvedValue(user);
    usersRepo.save.mockImplementation(async (value: User) => value);

    const result = await service.updateSettings('user-1', {
      aiDataSharingConsent: false,
    });

    expect(result.aiDataSharingConsent).toBe(false);
  });

  it('softDeleteAccount حساب را حذف نرم می‌کند', async () => {
    const user: User = {
      id: 'user-1',
      phone: '+989123456789',
      firstName: 'سپهر',
      lastName: 'محمدی',
      displayName: 'سپهر محمدی',
      email: null,
      avatarUrl: null,
      aiDataSharingConsent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    usersRepo.findOne.mockResolvedValue(user);
    usersRepo.softRemove.mockResolvedValue({ ...user, deletedAt: new Date() });

    await service.softDeleteAccount('user-1');

    expect(usersRepo.softRemove).toHaveBeenCalledWith(user);
  });

  it('verifyOtp کد نادرست را رد می‌کند', async () => {
    const challenge: OtpChallenge = {
      id: '1',
      phone: '+989123456789',
      codeHash: createHash('sha256').update('123456').digest('hex'),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      createdAt: new Date(),
    };

    otpRepo.findOne.mockResolvedValue(challenge);
    otpRepo.save.mockResolvedValue({ ...challenge, attempts: 1 });

    await expect(
      service.verifyOtp('+989123456789', '000000'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
