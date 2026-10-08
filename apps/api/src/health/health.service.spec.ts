import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('باید status ok برگرداند', () => {
    const result = service.check();
    expect(result.status).toBe('ok');
    expect(result.version).toBe('0.1.0');
    expect(result.timestamp).toBeDefined();
  });
});
