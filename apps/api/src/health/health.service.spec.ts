import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { MetricsService } from '../observability/metrics.service.js';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [HealthService, MetricsService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('باید status ok برگرداند', () => {
    const result = service.check();
    expect(result.status).toBe('ok');
    expect(result.version).toBe('0.1.0');
    expect(result.timestamp).toBeDefined();
  });

  it('metrics snapshot را در development برمی‌گرداند', () => {
    const snap = service.getMetrics();
    expect(snap.generatedAt).toBeDefined();
    expect(Array.isArray(snap.stages)).toBe(true);
  });
});

describe('HealthService metrics disabled', () => {
  it('وقتی METRICS_ENABLED خاموش و production باشد 404 می‌دهد', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'production',
              METRICS_ENABLED: 'false',
            }),
          ],
        }),
      ],
      providers: [HealthService, MetricsService],
    }).compile();

    const service = module.get<HealthService>(HealthService);
    expect(() => service.getMetrics()).toThrow(NotFoundException);
  });
});
