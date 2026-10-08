import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HealthResponseDto } from './dto/health-response.dto.js';
import { MetricsService } from '../observability/metrics.service.js';

@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
  ) {}

  check(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.config.get<string>('NODE_ENV', 'development'),
      version: '0.1.0',
    };
  }

  metricsEnabled(): boolean {
    const explicit = this.config.get<string>('METRICS_ENABLED');
    if (explicit === 'true') return true;
    if (explicit === 'false') return false;
    const env = this.config.get<string>('NODE_ENV', 'development');
    return env === 'development' || env === 'test';
  }

  getMetrics() {
    if (!this.metricsEnabled()) {
      throw new NotFoundException('Metrics endpoint is disabled');
    }
    try {
      return this.metrics.snapshot();
    } catch {
      throw new ServiceUnavailableException('Metrics unavailable');
    }
  }
}
