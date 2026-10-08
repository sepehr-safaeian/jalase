import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HealthResponseDto } from './dto/health-response.dto.js';

@Injectable()
export class HealthService {
  constructor(private readonly config: ConfigService) {}

  check(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.config.get<string>('NODE_ENV', 'development'),
      version: '0.1.0',
    };
  }
}
