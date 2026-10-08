import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ZibalService } from './zibal.service.js';

describe('ZibalService', () => {
  let service: ZibalService;
  let config: ConfigService;

  beforeEach(() => {
    config = {
      get: vi.fn((key: string, defaultValue?: string) => {
        if (key === 'ZIBAL_MERCHANT') return 'zibal';
        return defaultValue;
      }),
    } as unknown as ConfigService;
    service = new ZibalService(config);
  });

  it('getGatewayStartUrl returns Zibal start URL', () => {
    expect(service.getGatewayStartUrl(12345)).toBe(
      'https://gateway.zibal.ir/start/12345',
    );
  });

  it('requestPayment calls Zibal API', async () => {
    const mockResponse = { trackId: 99, result: 100, message: 'success' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      }),
    );

    const result = await service.requestPayment({
      amount: 160000,
      callbackUrl: 'http://localhost:3000/api/v1/payments/zibal/callback',
      orderId: 'order-1',
    });

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      'https://gateway.zibal.ir/v1/request',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          merchant: 'zibal',
          amount: 160000,
          callbackUrl:
            'http://localhost:3000/api/v1/payments/zibal/callback',
          orderId: 'order-1',
        }),
      }),
    );
  });
});
