import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FEATURE_FLAGS,
  getEnabledFeatures,
  type Tier,
} from '@jalase/shared';
import type { FeatureFlagsResponseDto } from './dto/feature-flags-response.dto.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly subscriptionsService?: SubscriptionsService,
  ) {}

  getFlags(userId?: string): FeatureFlagsResponseDto {
    const isDev = this.config.get<string>('NODE_ENV') === 'development';
    const tier = this.resolveTier(userId);

    return {
      tier,
      enabled: getEnabledFeatures({ tier, isDev }),
      all: FEATURE_FLAGS.map((f) => ({
        key: f.key,
        label: f.label,
        minTier: f.minTier,
        enabled: getEnabledFeatures({ tier, isDev }).includes(f.key),
      })),
    };
  }

  async getFlagsForUser(userId: string): Promise<FeatureFlagsResponseDto> {
    const isDev = this.config.get<string>('NODE_ENV') === 'development';
    const tier = this.subscriptionsService
      ? await this.subscriptionsService.getUserTier(userId)
      : this.config.get<Tier>('DEFAULT_TIER', 'free');

    return {
      tier,
      enabled: getEnabledFeatures({ tier, isDev }),
      all: FEATURE_FLAGS.map((f) => ({
        key: f.key,
        label: f.label,
        minTier: f.minTier,
        enabled: getEnabledFeatures({ tier, isDev }).includes(f.key),
      })),
    };
  }

  private resolveTier(userId?: string): Tier {
    if (userId && this.subscriptionsService) {
      return this.config.get<Tier>('DEFAULT_TIER', 'free');
    }
    return this.config.get<Tier>('DEFAULT_TIER', 'free');
  }
}
