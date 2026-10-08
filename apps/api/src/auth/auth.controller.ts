import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { SendOtpDto } from './dto/send-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { SendEmailOtpDto } from './dto/send-email-otp.dto.js';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto.js';
import {
  OtpSendResponseDto,
  OtpVerifyResponseDto,
} from './dto/auth-response.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { User } from './entities/user.entity.js';
import {
  AVATAR_MAX_BYTES,
  avatarFileFilter,
  avatarStorageFactory,
} from './avatar-upload.config.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP to Iranian mobile number' })
  @ApiResponse({ status: 201, type: OtpSendResponseDto })
  sendOtp(@Body() dto: SendOtpDto): Promise<OtpSendResponseDto> {
    return this.authService.sendOtp(dto.phone);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify phone OTP and issue token' })
  @ApiResponse({ status: 201, type: OtpVerifyResponseDto })
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<OtpVerifyResponseDto> {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  @Post('email/send-otp')
  @ApiOperation({ summary: 'Send OTP to email (logged in development)' })
  @ApiResponse({ status: 201, type: OtpSendResponseDto })
  sendEmailOtp(@Body() dto: SendEmailOtpDto): Promise<OtpSendResponseDto> {
    return this.authService.sendEmailOtp(dto.email);
  }

  @Post('email/verify-otp')
  @ApiOperation({ summary: 'Verify email OTP and issue token' })
  @ApiResponse({ status: 201, type: OtpVerifyResponseDto })
  verifyEmailOtp(
    @Body() dto: VerifyEmailOtpDto,
  ): Promise<OtpVerifyResponseDto> {
    return this.authService.verifyEmailOtp(dto.email, dto.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  getMe(@Req() req: Request & { user: User }): Promise<UserResponseDto> {
    return this.authService.getMe(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateProfile(
    @Req() req: Request & { user: User },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update privacy settings' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateSettings(
    @Req() req: Request & { user: User },
    @Body() dto: UpdateUserSettingsDto,
  ): Promise<UserResponseDto> {
    return this.authService.updateSettings(req.user.id, dto);
  }

  @Post('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary' },
      },
      required: ['avatar'],
    },
  })
  @ApiOperation({ summary: 'Upload profile avatar' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarStorageFactory(),
      limits: { fileSize: AVATAR_MAX_BYTES },
      fileFilter: avatarFileFilter,
    }),
  )
  uploadAvatar(
    @Req() req: Request & { user: User },
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UserResponseDto> {
    return this.authService.uploadAvatar(req.user.id, file);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete account' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  async deleteAccount(
    @Req() req: Request & { user: User },
  ): Promise<void> {
    await this.authService.softDeleteAccount(req.user.id);
  }
}
