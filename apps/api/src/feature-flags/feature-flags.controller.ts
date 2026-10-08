import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { FeatureFlagsService } from './feature-flags.service.js';
import { FeatureFlagsResponseDto } from './dto/feature-flags-response.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { User } from '../auth/entities/user.entity.js';

@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت feature flagهای فعال' })
  @ApiResponse({ status: 200, type: FeatureFlagsResponseDto })
  getFlags(): FeatureFlagsResponseDto {
    return this.featureFlagsService.getFlags();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'feature flagها بر اساس اشتراک کاربر' })
  @ApiResponse({ status: 200, type: FeatureFlagsResponseDto })
  getMyFlags(
    @Req() req: Request & { user: User },
  ): Promise<FeatureFlagsResponseDto> {
    return this.featureFlagsService.getFlagsForUser(req.user.id);
  }
}
